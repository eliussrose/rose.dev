# Design Document — rose.dev AI IDE (kora-ai-ide)

## Overview

rose.dev AI IDE is a Windows desktop AI-powered code editor built on **Electron + Next.js 16 + React 19 + Monaco Editor**. The renderer process is a Next.js app served locally by a bundled Next.js server; Electron wraps it in a native window and exposes filesystem, terminal, and LSP capabilities via IPC.

The existing codebase already has: Monaco editor with diff view, multi-provider AI via `callAI()`, file upload/open-folder, basic terminal, Pyright LSP wiring, agent mode (auto-accept edits), GitHub REST panel, and Python/Django analyzer. This design covers the thirteen requirements that bring the product to production quality.

### Design Goals

- Streaming AI responses with per-provider SSE/chunk parsing
- Persistent terminal with cwd tracking, history, and error auto-fix
- File operations (create/rename/delete) with full disk sync
- Multi-file context window management with token estimation
- Real-time LSP diagnostics via Monaco `setModelMarkers`
- AI code actions (explain, refactor, generate tests, lightbulb quick-fix)
- Git operations via shell commands (clone, status, stage, commit, push, pull)
- Spec/task workflow under `.kiro/specs/`
- Python/Django project analysis with dependency checking
- Per-provider settings with independent localStorage keys
- Multi-tab editor with unsaved-changes indicator
- Windows `.exe` build via electron-builder NSIS
- Terminal error auto-fix with agent-mode integration

---

## Architecture

The application follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  Electron Main Process (electron.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  IPC Handlers│  │  Next.js     │  │  LSP Server      │  │
│  │  (fs, term,  │  │  Child Proc  │  │  (pyright-lang-  │  │
│  │   lsp, git)  │  │  :3000       │  │   server)        │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘  │
│         │ contextBridge (preload.js)                        │
└─────────┼───────────────────────────────────────────────────┘
          │ window.electron.*
┌─────────▼───────────────────────────────────────────────────┐
│  Renderer Process (Next.js / React)                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ page.tsx │  │ app/lib/ai.ts│  │ app/lib/lsp/         │  │
│  │ (state)  │  │ callAI()     │  │ (LSP client hooks)   │  │
│  └────┬─────┘  └──────────────┘  └──────────────────────┘  │
│       │                                                      │
│  ┌────▼──────────────────────────────────────────────────┐  │
│  │  Components                                           │  │
│  │  Sidebar │ EditorSection │ ChatSection │ Terminal      │  │
│  │  GitHubPanel │ ProjectAnalyzer │ SpecsPanel           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**State ownership**: All application state lives in `app/page.tsx` and is passed down as props. No global state library is used. `localStorage` persists sessions, project items, and per-provider settings.

**IPC boundary**: The renderer never calls Node.js APIs directly. All filesystem, terminal, LSP, and git operations cross the IPC boundary via `window.electron.*` (exposed by `preload.js` via `contextBridge`).

---

## Components and Interfaces

### New / Modified Components

#### `app/lib/ai.ts` — Streaming Extension

Add `onChunk` callback to `AICallOptions` and implement per-provider streaming:

```typescript
export interface AICallOptions {
  // ... existing fields ...
  onChunk?: (chunk: string) => void; // NEW: called for each token chunk
}
```

Each provider branch gains a streaming path that calls `onChunk` incrementally and returns the full concatenated string.

#### `app/components/Terminal.tsx` — Enhanced Terminal

New state:
- `currentDirectory: string` — tracks cwd, initialized from workspace root
- `commandHistory: string[]` — last 100 commands
- `historyIndex: number` — current Up/Down position
- `terminalErrorOutput: string | null` — last failed command output
- `isFixing: boolean` — AI fix in flight

New props:
```typescript
interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceRoot?: string;        // NEW: initialize cwd
  agentMode?: boolean;           // NEW: auto-fix vs button
  onFixRequest?: (error: string, files: ProjectItem[]) => void; // NEW
  projectItems?: ProjectItem[];  // NEW: for error context
}
```

#### `app/components/ProjectTree.tsx` — Context Menu + Context Badge

New behavior:
- Right-click on any node opens a `ContextMenu` component with: New File, New Folder, Rename, Delete
- Each file node shows a `@` badge (context indicator) that toggles `referencedFileIds`
- Drag-to-chat already exists; badge is a persistent toggle

#### `app/components/EditorSection.tsx` — Tabs, Unsaved Indicator, Code Actions, Spec Toolbar

New state:
- `savedContents: Record<string, string>` — last-saved content per file id, for unsaved detection
- `diagnosticCounts: Record<string, { errors: number; warnings: number }>` — per-file LSP counts

New props:
```typescript
interface EditorSectionProps {
  // ... existing ...
  diagnostics?: Record<string, IMarkerData[]>; // NEW: from LSP
  onCodeAction?: (action: 'explain' | 'refactor' | 'tests', selection: string, fileContext: string) => void; // NEW
  isSpecFile?: boolean;          // NEW: show spec toolbar buttons
  onGenerateDesign?: () => void; // NEW
  onGenerateTask?: () => void;   // NEW
}
```

#### `app/components/SpecsPanel.tsx` — NEW

Sidebar tab for spec/task workflow:
```typescript
interface SpecsPanelProps {
  workspaceRoot: string;
  projectItems: ProjectItem[];
  onOpenFile: (id: string) => void;
  onCreateSpec: (name: string) => void;
  isElectron: boolean;
}
```

#### `app/components/GitHubPanel.tsx` — Git Shell Operations

Replace REST API approach with shell-command approach for local git operations. The panel now calls `window.electron.executeCommand('git ...')` with the workspace cwd.

New state:
- `gitStatus: GitFileStatus[]` — parsed `git status --porcelain` output
- `currentBranch: string`
- `autoRefreshInterval: ReturnType<typeof setInterval>`

```typescript
interface GitFileStatus {
  path: string;
  status: 'M' | 'A' | 'D' | '?' | 'R'; // Modified, Added, Deleted, Untracked, Renamed
  staged: boolean;
}
```

#### `app/components/SettingsPanel.tsx` — NEW (extracted from Sidebar)

Per-provider settings with independent localStorage keys:
```typescript
// localStorage key pattern: `provider_settings_${providerName}`
interface ProviderSettings {
  token: string;
  modelId: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
}
```

### IPC Extensions (`electron.js` + `preload.js`)

New IPC handlers:

| Handler | Description |
|---|---|
| `create-directory` | `fs.mkdir(path, { recursive: true })` |
| `rename-path` | `fs.rename(oldPath, newPath)` |
| `execute-command-cwd` | `spawn(cmd, { shell: true, cwd })` — replaces `execute-command` for terminal |
| `git-command` | Alias for `execute-command-cwd` scoped to workspace root |

The existing `execute-command` handler is extended to accept an optional `cwd` parameter.

---

## Data Models

### Extended `ProjectItem`

```typescript
export interface ProjectItem {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  path: string;
  diskPath?: string;
  isOpen?: boolean;
  inContext?: boolean;       // NEW: included in AI context window
  savedContent?: string;     // NEW: last-saved disk content for unsaved indicator
}
```

### Extended `Message`

```typescript
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  isTyping?: boolean;
  isStreaming?: boolean;     // NEW: token stream in progress
  type?: "text" | "image" | "diff" | "code-action"; // NEW: code-action type
  imageUrl?: string;
  editId?: string;
}
```

### New: `TerminalSession`

```typescript
export interface TerminalSession {
  currentDirectory: string;
  commandHistory: string[];   // max 100
  historyIndex: number;       // -1 = not browsing
  lastFailedCommand: string | null;
  lastErrorOutput: string | null;
  autoFixRetryCount: number;  // max 1
}
```

### New: `ProviderSettings`

```typescript
export interface ProviderSettings {
  token: string;
  modelId: string;
  baseUrl: string;
  temperature: number;  // 0.0–2.0
  maxTokens: number;    // 256–32768
}
// Stored as: localStorage.setItem(`provider_settings_${provider}`, JSON.stringify(settings))
```

### New: `GitStatus`

```typescript
export interface GitFileStatus {
  path: string;
  status: 'M' | 'A' | 'D' | '?' | 'R';
  staged: boolean;
}

export interface GitStatus {
  branch: string;
  files: GitFileStatus[];
  lastRefreshed: number;
}
```

### New: `DiagnosticsMap`

```typescript
// Keyed by file URI (file:///absolute/path)
export type DiagnosticsMap = Record<string, import('monaco-editor').editor.IMarkerData[]>;
```

### New: `SpecMeta`

```typescript
export interface SpecMeta {
  name: string;           // kebab-case feature name
  dirPath: string;        // .kiro/specs/<name>/
  hasRequirements: boolean;
  hasDesign: boolean;
  hasTasks: boolean;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Streaming round-trip

*For any* valid `AICallOptions` with a mock provider that returns a known string, if `onChunk` is provided, then concatenating all chunks delivered to `onChunk` must produce a string equal to the value returned by `callAI`.

**Validates: Requirements 1.9, 1.10**

---

### Property 2: Terminal cd resolves paths correctly

*For any* `currentDirectory` string and any relative or absolute `cd` target path, executing the cd command must update `currentDirectory` to the correct resolved absolute path (equivalent to `path.resolve(currentDirectory, target)`).

**Validates: Requirements 2.2**

---

### Property 3: Non-cd commands receive correct cwd

*For any* terminal command string that is not a `cd` command, the `cwd` argument passed to the `execute-command` IPC handler must equal the current `currentDirectory` state.

**Validates: Requirements 2.3**

---

### Property 4: Terminal output truncation

*For any* command output string whose length exceeds 10,000 characters, the string stored for display must have length ≤ 10,000 characters and must be prefixed with a truncation notice.

**Validates: Requirements 2.5**

---

### Property 5: Command history bounded at 100

*For any* sequence of N commands executed in the terminal, the command history array must contain exactly `min(N, 100)` entries and must contain the most recent `min(N, 100)` commands in order.

**Validates: Requirements 2.6**

---

### Property 6: Failed disk operations leave project tree unchanged

*For any* file operation (create, rename, delete) where the IPC handler returns `success: false`, the `projectItems` array after the operation must be deeply equal to the `projectItems` array before the operation.

**Validates: Requirements 3.6**

---

### Property 7: Context window includes exactly the referenced files

*For any* non-empty `referencedFileIds` set and any `projectItems` array, the system prompt built by `buildSystemPrompt` must contain the content of every file whose id is in `referencedFileIds` and must not contain the content of any file whose id is not in `referencedFileIds`.

**Validates: Requirements 4.3, 4.7**

---

### Property 8: Token estimation is 4 chars per token

*For any* string `s`, the estimated token count returned by `estimateTokens(s)` must equal `Math.ceil(s.length / 4)`.

**Validates: Requirements 4.6**

---

### Property 9: Diagnostics status bar count matches marker data

*For any* array of `IMarkerData` objects for a file, the error count displayed in the StatusBar must equal the number of markers with `severity === MarkerSeverity.Error` and the warning count must equal the number of markers with `severity === MarkerSeverity.Warning`.

**Validates: Requirements 5.4**

---

### Property 10: Spec directory path is correctly derived from feature name

*For any* valid kebab-case feature name string, the spec directory path created by `createSpec` must equal `.kiro/specs/${featureName}/`.

**Validates: Requirements 8.2**

---

### Property 11: Checkbox toggle is an involution

*For any* `tasks.md` content string, applying `toggleCheckbox` twice to the same line must produce a string equal to the original content (toggling is its own inverse).

**Validates: Requirements 8.7, 8.8**

---

### Property 12: Per-provider settings are stored and retrieved independently

*For any* two distinct provider names and any two distinct `ProviderSettings` objects, saving settings for provider A and then loading settings for provider B must return provider B's settings unchanged, and loading settings for provider A must return provider A's settings.

**Validates: Requirements 10.2, 10.3**

---

### Property 13: Unsaved indicator reflects content difference

*For any* `ProjectItem` with a `savedContent` field, the unsaved indicator for that file must be shown if and only if `item.content !== item.savedContent`.

**Validates: Requirements 11.2**

---

### Property 14: Terminal error output is captured on non-zero exit

*For any* command that exits with a non-zero code, the `terminalErrorOutput` field in `TerminalSession` must be a non-empty string containing the command's stderr or stdout output.

**Validates: Requirements 13.1**

---

### Property 15: Auto-fix retry count never exceeds 1

*For any* sequence of terminal commands that all fail, the `autoFixRetryCount` for a single command must never exceed 1 before being reset by a new command.

**Validates: Requirements 13.9**

---

## Error Handling

### AI / Network Errors

- `callAI` wraps all provider fetches in try/catch. On error during streaming, `onChunk` stops being called, the partial accumulated string is returned, and an error suffix is appended to the chat message.
- Provider-specific HTTP error codes (401, 429, 500) are mapped to user-readable messages: "Invalid API key", "Rate limit exceeded", "Provider error".

### IPC / Filesystem Errors

- All IPC handlers return `{ success: boolean, error?: string }`. The renderer checks `result.success` before updating state.
- Failed file operations show a toast notification (non-blocking) and leave `projectItems` unchanged (see Property 6).
- The `rename-path` handler must handle cross-device renames by falling back to copy+delete.

### LSP Errors

- If `lsp-start` fails (pyright not found), the IDE shows a one-time warning banner: "Python LSP unavailable — install pyright globally or check extraResources."
- LSP request timeouts (5 s, already in `electron.js`) are surfaced as a status bar indicator rather than a modal.
- `textDocument/didChange` notifications are debounced at 500 ms to avoid flooding the LSP.

### Terminal Errors

- Commands exceeding the 30 s timeout show "Command timed out" in red.
- Output exceeding 10,000 chars is truncated with a notice (Property 4).
- The auto-fix loop is capped at 1 retry (Property 15) to prevent infinite loops.

### Git Errors

- Any `git` command returning non-zero exit code surfaces stderr in the GitHubPanel as a red error block.
- If `git` is not installed, the panel shows a static warning: "git not found in PATH."
- The 30-second auto-refresh is paused when no workspace is open.

### Build Errors

- The `electron:build:win` script exits non-zero if `next build` fails, preventing a broken `.exe` from being produced.
- Orphaned processes (Next.js server, LSP) are killed in `before-quit` and `window-all-closed` handlers.

---

## Testing Strategy

### Unit Tests (example-based)

Focus on pure functions and specific scenarios:

- `buildSystemPrompt(referencedFileIds, projectItems, systemPrompt)` — verify XML context block structure
- `estimateTokens(str)` — verify 4-chars-per-token formula
- `parsePythonTraceback(output)` — verify file path extraction from tracebacks
- `resolveTerminalPath(cwd, target)` — verify cd path resolution
- `toggleCheckbox(content, lineIndex)` — verify `[ ]` ↔ `[x]` toggle
- `parseGitStatus(porcelainOutput)` — verify status parsing into `GitFileStatus[]`
- `truncateOutput(output, maxLen)` — verify truncation with notice

### Property-Based Tests

Use **fast-check** (TypeScript-native PBT library). Each test runs a minimum of **100 iterations**.

Tag format: `// Feature: kora-ai-ide, Property {N}: {property_text}`

Properties to implement (one test per property):

| Property | Test file | Generator |
|---|---|---|
| 1 — Streaming round-trip | `__tests__/ai.property.test.ts` | `fc.record({ messages, systemPrompt })` with mock fetch |
| 2 — cd path resolution | `__tests__/terminal.property.test.ts` | `fc.string()` for cwd + target |
| 3 — Non-cd cwd passthrough | `__tests__/terminal.property.test.ts` | `fc.string().filter(s => !s.startsWith('cd '))` |
| 4 — Output truncation | `__tests__/terminal.property.test.ts` | `fc.string({ minLength: 10001 })` |
| 5 — History bounded at 100 | `__tests__/terminal.property.test.ts` | `fc.array(fc.string(), { minLength: 1, maxLength: 200 })` |
| 6 — Failed ops leave tree unchanged | `__tests__/fileops.property.test.ts` | `fc.array(projectItemArb)` |
| 7 — Context window file inclusion | `__tests__/context.property.test.ts` | `fc.array(projectItemArb)` + `fc.set(fc.string())` |
| 8 — Token estimation | `__tests__/context.property.test.ts` | `fc.string()` |
| 9 — Diagnostics count | `__tests__/lsp.property.test.ts` | `fc.array(markerDataArb)` |
| 10 — Spec path derivation | `__tests__/specs.property.test.ts` | `fc.stringMatching(/^[a-z][a-z0-9-]*$/)` |
| 11 — Checkbox toggle involution | `__tests__/specs.property.test.ts` | `fc.string()` with injected `- [ ]` lines |
| 12 — Per-provider settings isolation | `__tests__/settings.property.test.ts` | `fc.record(providerSettingsArb)` × 2 providers |
| 13 — Unsaved indicator | `__tests__/editor.property.test.ts` | `fc.tuple(fc.string(), fc.string())` |
| 14 — Error output captured | `__tests__/terminal.property.test.ts` | `fc.string({ minLength: 1 })` as error output |
| 15 — Retry count ≤ 1 | `__tests__/terminal.property.test.ts` | `fc.array(fc.string(), { minLength: 2 })` as failing commands |

### Integration Tests

- LSP: start pyright, open a `.py` file with a known type error, verify `publishDiagnostics` fires with the expected error
- GitHub panel: mock `git status --porcelain` output, verify parsed `GitFileStatus[]`
- Terminal IPC: mock `execute-command` to return `success: false`, verify red error display
- Electron build: verify `dist-electron/` contains a `.exe` after `electron:build:win`

### Smoke Tests

- App launches and renders without JS errors
- LSP `lsp-status` returns `{ isRunning: false }` before any Python file is opened
- `electron-builder.json` contains required fields (`appId`, `productName`, `copyright`, `nsis`)
- `create-directory` and `rename-path` IPC handlers are registered in `electron.js`
