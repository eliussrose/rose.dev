# Implementation Plan: rose.dev AI IDE (kora-ai-ide)

## Overview

Incremental implementation ordered by dependency and priority. Each phase builds on the previous. The stack is TypeScript + React 19 + Next.js 16 + Electron + Monaco Editor. All state lives in `app/page.tsx`; IPC crosses via `window.electron.*`.

---

## Tasks

- [x] 1. Extend type definitions and shared utilities
  - Add `inContext`, `savedContent` fields to `ProjectItem` in `app/types.ts`
  - Add `isStreaming` and `code-action` type to `Message` in `app/types.ts`
  - Add `TerminalSession`, `ProviderSettings`, `GitFileStatus`, `GitStatus`, `DiagnosticsMap`, `SpecMeta` interfaces to `app/types.ts`
  - Create `app/lib/utils/tokenEstimator.ts` exporting `estimateTokens(s: string): number` using `Math.ceil(s.length / 4)`
  - Create `app/lib/utils/terminalUtils.ts` exporting `resolveTerminalPath(cwd: string, target: string): string` and `truncateOutput(output: string, maxLen: number): string`
  - Create `app/lib/utils/specUtils.ts` exporting `getSpecDirPath(featureName: string): string` and `toggleCheckbox(content: string, lineIndex: number): string`
  - Create `app/lib/utils/gitUtils.ts` exporting `parseGitStatus(porcelain: string): GitFileStatus[]`
  - _Requirements: 2.2, 2.5, 4.6, 8.2, 8.7_

- [x] 2. Add streaming support to `app/lib/ai.ts`
  - [x] 2.1 Add `onChunk?: (chunk: string) => void` to `AICallOptions` interface
    - Implement streaming path for OpenAI/DeepSeek/GLM/Custom using SSE `data:` line parsing
    - Implement streaming path for Anthropic using `content_block_delta` SSE events
    - Implement streaming path for Gemini using `streamGenerateContent` endpoint
    - Implement streaming path for Ollama using `stream: true` with newline-delimited JSON
    - Implement streaming path for HuggingFace using the inference streaming API
    - Each streaming path must call `onChunk` per token chunk and return the full concatenated string
    - Fall back to non-streaming when `onChunk` is not provided (preserves existing behaviour)
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 2.2 Write property test for streaming round-trip (Property 1)
    - **Property 1: Streaming round-trip — concatenated chunks equal non-streaming response**
    - **Validates: Requirements 1.9, 1.10**
    - File: `__tests__/ai.property.test.ts` using `fast-check`

- [x] 3. Wire streaming into `app/page.tsx` and `ChatSection`
  - Pass `onChunk` callback to `callAI` that appends to the in-progress assistant message via `setSessions`
  - Set `isStreaming: true` on the message while chunks arrive; set to `false` on completion
  - Display a blinking cursor in `ChatSection` when the last assistant message has `isStreaming: true`
  - On network error mid-stream, append an error notice to the partial message
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Extend Electron IPC handlers in `electron.js`
  - [x] 4.1 Add `create-directory` handler using `fs.mkdir(path, { recursive: true })`
    - Returns `{ success: boolean, error?: string }`
    - _Requirements: 3.3, 3.8_

  - [x] 4.2 Add `rename-path` handler using `fs.rename(oldPath, newPath)` with cross-device fallback (copy + delete)
    - Returns `{ success: boolean, error?: string }`
    - _Requirements: 3.4, 3.9_

  - [x] 4.3 Extend `execute-command` handler to accept optional `cwd` parameter
    - When `cwd` is provided, pass it to `spawn` options; otherwise keep existing `process.cwd()` default
    - Return `{ success: boolean, output: string }` including stderr on failure
    - _Requirements: 2.3, 7.2, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 4.4 Expose new handlers in `preload.js` via `contextBridge`
    - Add `electron.createDirectory(path)`, `electron.renamePath(oldPath, newPath)`
    - Extend `electron.executeCommand(command, cwd?)` signature
    - _Requirements: 3.3, 3.4, 3.8, 3.9_

- [x] 5. Upgrade Terminal component (`app/components/Terminal.tsx`)
  - [x] 5.1 Add `currentDirectory`, `commandHistory`, `historyIndex`, `terminalErrorOutput`, `isFixing` state
    - Accept new props: `workspaceRoot`, `agentMode`, `onFixRequest`, `projectItems`
    - Initialize `currentDirectory` from `workspaceRoot` prop; reset when `workspaceRoot` changes
    - Display `currentDirectory` in the prompt before the `$` symbol
    - _Requirements: 2.1, 2.4, 2.9_

  - [x] 5.2 Implement `cd` command handling and cwd-aware command execution
    - Intercept `cd <path>` commands: resolve via `path.resolve(currentDirectory, target)` and update state
    - Pass `cwd: currentDirectory` to `execute-command` IPC for all non-`cd` commands
    - _Requirements: 2.2, 2.3_

  - [ ]* 5.3 Write property tests for terminal path resolution and cwd passthrough (Properties 2, 3)
    - **Property 2: cd resolves paths correctly**
    - **Property 3: Non-cd commands receive correct cwd**
    - **Validates: Requirements 2.2, 2.3**
    - File: `__tests__/terminal.property.test.ts`

  - [x] 5.4 Implement command history (Up/Down arrow cycling, max 100 entries)
    - Truncate output exceeding 10,000 characters with a truncation notice
    - Display error output in red when `success: false`
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

  - [ ]* 5.5 Write property tests for output truncation and history bound (Properties 4, 5)
    - **Property 4: Output truncation at 10,000 chars**
    - **Property 5: Command history bounded at 100**
    - **Validates: Requirements 2.5, 2.6**
    - File: `__tests__/terminal.property.test.ts`

  - [x] 5.6 Implement terminal error auto-fix (Requirement 13)
    - Capture `terminalErrorOutput` on non-zero exit
    - In agent mode: auto-send fix request via `onFixRequest` prop
    - In manual mode: show inline "Fix this error" button below error output
    - Parse Python traceback patterns (`File "<path>", line <n>`) to extract referenced file paths
    - Show spinner + "AI fixing..." while fix is in flight; cap auto-retry at 1
    - After applying fix, re-run the last failed command automatically
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_

  - [ ]* 5.7 Write property tests for error capture and retry cap (Properties 14, 15)
    - **Property 14: Terminal error output captured on non-zero exit**
    - **Property 15: Auto-fix retry count never exceeds 1**
    - **Validates: Requirements 13.1, 13.9**
    - File: `__tests__/terminal.property.test.ts`

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. File operations with disk sync
  - [x] 7.1 Add right-click context menu to `ProjectTree` nodes
    - Create a `ContextMenu` component rendered at cursor position with options: New File, New Folder, Rename, Delete
    - Wire each option to the corresponding handler in `app/page.tsx`
    - _Requirements: 3.1_

  - [x] 7.2 Implement create file/folder with disk sync in `app/page.tsx`
    - On "New File": prompt for name, call `electron.writeFile` (creates empty file), add `ProjectItem`
    - On "New Folder": prompt for name, call `electron.createDirectory`, add `ProjectItem` of type `folder`
    - On failure: show error notification, leave `projectItems` unchanged
    - _Requirements: 3.2, 3.3, 3.6_

  - [x] 7.3 Implement rename with disk sync in `app/page.tsx`
    - On "Rename": prompt for new name, call `electron.renamePath`, update `name`, `path`, `diskPath` on the item and all descendants
    - On failure: show error notification, leave `projectItems` unchanged
    - _Requirements: 3.4, 3.6_

  - [x] 7.4 Implement delete with disk sync in `app/page.tsx`
    - On "Delete" + confirm: call `electron.deleteFile`, remove item and all descendants from `projectItems`
    - On failure: show error notification, leave `projectItems` unchanged
    - _Requirements: 3.5, 3.6_

  - [ ]* 7.5 Write property test for failed disk ops leaving tree unchanged (Property 6)
    - **Property 6: Failed disk operations leave project tree unchanged**
    - **Validates: Requirements 3.6**
    - File: `__tests__/fileops.property.test.ts`

- [x] 8. Multi-file context window management
  - [x] 8.1 Add context toggle badge to `ProjectTree` file nodes
    - Show `@` badge on each file node; clicking toggles `inContext` on the `ProjectItem` and updates `referencedFileIds` in `app/page.tsx`
    - Display count pill in `ChatSection` input area (e.g., "3 files in context")
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 8.2 Update `buildSystemPrompt` in `app/page.tsx` to use `referencedFileIds`
    - When `referencedFileIds` is non-empty, include only those files under a `<context>` XML block
    - When empty, include all open files (existing behaviour)
    - Use `estimateTokens` to compute context size; show yellow warning badge in `ChatSection` header when > 80% of model context limit
    - _Requirements: 4.3, 4.5, 4.6, 4.7_

  - [ ]* 8.3 Write property tests for context inclusion and token estimation (Properties 7, 8)
    - **Property 7: Context window includes exactly the referenced files**
    - **Property 8: Token estimation is 4 chars per token**
    - **Validates: Requirements 4.3, 4.6, 4.7**
    - File: `__tests__/context.property.test.ts`

- [ ] 9. LSP diagnostics integration in Monaco editor
  - [ ] 9.1 Subscribe to `lsp-notification` in `app/page.tsx` (or a dedicated hook)
    - On `textDocument/publishDiagnostics`: convert each diagnostic to `IMarkerData` and call `monaco.editor.setModelMarkers`
    - Store `DiagnosticsMap` in state and pass to `EditorSection`
    - Auto-start LSP via `lsp-start` when a Python file is opened and LSP is not running
    - _Requirements: 5.1, 5.2, 5.8_

  - [ ] 9.2 Send LSP lifecycle notifications from `EditorSection` / `app/page.tsx`
    - `textDocument/didOpen` when a file is opened
    - `textDocument/didChange` debounced at 500 ms on editor content change
    - `textDocument/didClose` when a file tab is closed
    - _Requirements: 5.5, 5.6, 5.7_

  - [ ] 9.3 Update `EditorSection` status bar to show error/warning counts from `DiagnosticsMap`
    - Replace hardcoded "0 Errors" with live counts from the active file's marker data
    - _Requirements: 5.4_

  - [ ]* 9.4 Write property test for diagnostics count matching marker data (Property 9)
    - **Property 9: Diagnostics status bar count matches marker data**
    - **Validates: Requirements 5.4**
    - File: `__tests__/lsp.property.test.ts`

- [x] 10. Multi-tab editor with unsaved changes indicator
  - [x] 10.1 Track `savedContent` per open file in `app/page.tsx`
    - Set `savedContent` equal to `content` when a file is opened from disk or saved via Ctrl+S / agent auto-save
    - Pass `savedContents` map to `EditorSection`
    - _Requirements: 11.2, 11.7_

  - [x] 10.2 Show unsaved dot indicator on tabs in `EditorSection`
    - Render a dot on the tab when `item.content !== savedContents[item.id]`
    - On Ctrl+S: call `save-file-to-disk`, update `savedContent`, clear indicator
    - On tab close with unsaved changes: show confirmation dialog
    - Support middle-click to close tab with same unsaved-changes check
    - Enable horizontal scroll on tab bar when tabs overflow
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 10.3 Write property test for unsaved indicator (Property 13)
    - **Property 13: Unsaved indicator reflects content difference**
    - **Validates: Requirements 11.2**
    - File: `__tests__/editor.property.test.ts`

- [x] 11. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. AI code actions (explain, refactor, generate tests, lightbulb quick-fix)
  - [ ] 12.1 Add right-click context menu to Monaco editor for AI actions
    - Register a Monaco context menu contribution with items: "Explain Selection", "Refactor Selection", "Generate Tests for Selection"
    - Wire each to `onCodeAction` prop callback in `EditorSection`
    - _Requirements: 6.1_

  - [ ] 12.2 Implement "Explain Selection" action in `app/page.tsx`
    - Send selected text + file context to active provider
    - Display response in a floating panel anchored to the selection position
    - _Requirements: 6.2_

  - [ ] 12.3 Implement "Refactor Selection" and "Generate Tests" actions in `app/page.tsx`
    - Refactor: send selection with refactor instruction; display result as `PendingEdit` for active file
    - Generate Tests: send selection; display result as `PendingEdit` targeting a new or existing test file
    - _Requirements: 6.3, 6.4_

  - [ ] 12.4 Implement LSP lightbulb quick-fix in `EditorSection`
    - Show lightbulb glyph in Monaco gutter on lines with LSP error diagnostics
    - On click: send error message + ±10 lines of context to provider; display result as `PendingEdit`
    - Show spinner in glyph while request is in flight
    - _Requirements: 6.5, 6.6, 6.7_

- [x] 13. Settings panel — per-provider configuration
  - [x] 13.1 Create `app/components/SettingsPanel.tsx`
    - Extract provider settings form from `Sidebar` into a dedicated panel accessible via gear icon in sidebar footer
    - Store each provider's settings independently under `provider_settings_${providerName}` in `localStorage`
    - Load saved settings when provider dropdown changes
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 13.2 Add temperature slider (0.0–2.0, step 0.1) and max tokens input (256–32768)
    - Add "Test Connection" button that sends "Hello" to the active provider and shows "Connected" or error
    - Add "Refresh Models" button for Ollama that fetches `/api/tags` and populates model dropdown
    - Show active provider name + model in sidebar footer at all times
    - On "Save": persist to `localStorage` and show success toast
    - _Requirements: 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [ ]* 13.3 Write property test for per-provider settings isolation (Property 12)
    - **Property 12: Per-provider settings are stored and retrieved independently**
    - **Validates: Requirements 10.2, 10.3**
    - File: `__tests__/settings.property.test.ts`

- [ ] 14. Spec / task workflow
  - [ ] 14.1 Create `app/components/SpecsPanel.tsx`
    - Add "Specs" tab to `Sidebar` tab bar
    - Scan `.kiro/specs/` in the workspace root and list spec directories as `SpecMeta` items
    - "New Spec" button: prompt for kebab-case name, create `.kiro/specs/<name>/` via `create-directory`, create `requirements.md` template via `write-file`, open the file in the editor
    - _Requirements: 8.1, 8.2_

  - [ ]* 14.2 Write property test for spec directory path derivation (Property 10)
    - **Property 10: Spec directory path is correctly derived from feature name**
    - **Validates: Requirements 8.2**
    - File: `__tests__/specs.property.test.ts`

  - [ ] 14.3 Add spec toolbar buttons to `EditorSection`
    - When active file is `requirements.md` inside `.kiro/specs/`: show "Generate Design" button
    - When active file is `design.md` inside `.kiro/specs/`: show "Generate Tasks" button
    - Wire buttons to `onGenerateDesign` / `onGenerateTask` props
    - _Requirements: 8.3, 8.5_

  - [ ] 14.4 Implement "Generate Design" and "Generate Tasks" in `app/page.tsx`
    - Generate Design: send `requirements.md` content to active provider; write response to `design.md` via `write-file` IPC; open the file
    - Generate Tasks: send `design.md` content to active provider; write response to `tasks.md` via `write-file` IPC; open the file
    - _Requirements: 8.4, 8.6_

  - [ ] 14.5 Implement interactive checkboxes in `tasks.md` editor view
    - When active file is `tasks.md`: render clickable checkboxes for lines matching `- [ ]` / `- [x]`
    - On click: call `toggleCheckbox(content, lineIndex)`, update file content, save to disk
    - _Requirements: 8.7, 8.8_

  - [ ]* 14.6 Write property test for checkbox toggle involution (Property 11)
    - **Property 11: Checkbox toggle is an involution**
    - **Validates: Requirements 8.7, 8.8**
    - File: `__tests__/specs.property.test.ts`

- [x] 15. GitHub integration — local git via shell commands
  - [x] 15.1 Rewrite `GitHubPanel` to use shell-command approach
    - Replace REST API calls with `window.electron.executeCommand('git ...', workspaceRoot)`
    - Fetch and display current branch via `git branch --show-current`
    - Fetch and display changed files via `git status --porcelain` parsed into `GitFileStatus[]`
    - Auto-refresh every 30 seconds while workspace is open; pause when no workspace
    - _Requirements: 7.3, 7.4, 7.11_

  - [x] 15.2 Implement stage, commit, push, pull actions
    - "Stage All": `git add -A` then refresh status
    - "Stage" per file: `git add <filepath>` then refresh status
    - "Commit": `git commit -m "<message>"` then refresh status
    - "Push": `git push`, display output in panel
    - "Pull": `git pull`, display output, reload changed files from disk
    - Display stderr as red error block on non-zero exit; show static warning if `git` not in PATH
    - _Requirements: 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

  - [x] 15.3 Implement "Clone Repository" in `GitHubPanel`
    - Accept HTTPS or SSH URL + target local directory path
    - Execute `git clone <url> <path>` via terminal IPC; open cloned folder as workspace on success
    - _Requirements: 7.1, 7.2_

- [x] 16. Python and Django project analysis
  - [x] 16.1 Update `ProjectAnalyzer` to scan workspace and send structured analysis prompt
    - Detect `manage.py` in workspace root; show "Django Project" badge in sidebar header
    - "Analyze Project": collect all `.py` file paths + contents, send to active provider with structured prompt
    - Display results grouped into Errors, Warnings, Suggestions, Dependencies sections with summary badges
    - _Requirements: 9.1, 9.2, 9.3, 9.6_

  - [x] 16.2 Add dependency and requirements.txt helpers
    - When analysis finds missing `requirements.txt` / `pyproject.toml`: show "Generate requirements.txt" button; send import statements to provider; write result via `write-file`
    - "Check Installed": run `pip list`, compare against `requirements.txt`, highlight missing packages
    - Clicking a file path in analysis results opens that file in the editor and scrolls to the referenced line
    - _Requirements: 9.4, 9.5, 9.7_

- [x] 17. Windows `.exe` build configuration
  - [x] 17.1 Update `electron-builder.json` to meet all build requirements
    - Set `appId` to `com.taskkora.kora-ai`, `productName` to `Kora AI`, add `copyright` field `Copyright © 2026 Taskkora`
    - Set `directories.output` to `dist-electron`, `directories.buildResources` to `public`
    - Configure `extraResources` to include the `pyright` binary
    - Ensure `win.target` includes `nsis` format
    - _Requirements: 12.1, 12.2, 12.5, 12.8_

  - [x] 17.2 Update `electron.js` for clean process lifecycle
    - In `before-quit` and `window-all-closed`: terminate Next.js child process and LSP server process
    - Ensure `startNextServer` starts the bundled Next.js standalone server in production
    - _Requirements: 12.4, 12.7_

  - [x] 17.3 Verify `package.json` build script
    - Confirm `electron:build:win` runs `next build` then `electron-builder --win` in sequence
    - _Requirements: 12.6_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already compatible with the TypeScript stack); install with `npm install --save-dev fast-check`
- Each property test file maps to one or more correctness properties defined in `design.md`
- Checkpoints at tasks 6, 11, and 18 validate incremental progress before moving to the next phase
