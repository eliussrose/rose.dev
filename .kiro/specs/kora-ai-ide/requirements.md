# Requirements Document

## Introduction

Kora AI is a Windows desktop IDE (Electron + Next.js) targeting local personal use. The existing codebase already has Monaco editor, basic chat, file upload, terminal, Pyright LSP, agent mode (auto-accept edits), Electron IPC for open-folder/save-to-disk, and all AI providers wired up via `app/lib/ai.ts`.

This document specifies what must be **added or improved** to reach Kiro.dev-level quality: a fully-featured, production-grade local AI IDE with deep Python/Django support, robust file management, streaming AI responses, multi-tab editing, an interactive terminal, spec/task workflows, and a polished Windows `.exe` build.

---

## Glossary

- **IDE**: The Kora AI desktop application as a whole.
- **Editor**: The Monaco-based code editing area within the IDE.
- **Agent**: The autonomous AI mode that applies file edits without user confirmation.
- **LSP**: Language Server Protocol; Pyright is the Python language server already integrated.
- **Provider**: An AI backend (DeepSeek, OpenAI, Anthropic, Gemini, HuggingFace, Ollama, GLM, Custom).
- **Session**: A single chat conversation thread with its own message history and pending edits.
- **PendingEdit**: An AI-proposed file change awaiting user accept/reject.
- **ProjectItem**: A file or folder node in the in-memory project tree.
- **DiskPath**: The absolute filesystem path of a file opened from disk via Electron.
- **Terminal**: The embedded command-line panel inside the IDE.
- **Spec**: A structured requirements + design + tasks document set stored under `.kiro/specs/`.
- **Diff**: A side-by-side or inline view comparing original and AI-proposed file content.
- **Streaming**: Incremental delivery of AI response tokens as they are generated.
- **Context_Window**: The set of file contents and conversation history sent to the AI provider.
- **Workspace**: The root folder opened by the user via the native folder dialog.
- **StatusBar**: The bottom bar of the Editor showing language, cursor position, and diagnostics.
- **Breadcrumb**: The file-path navigation strip above the Editor.
- **Diagnostics**: Errors and warnings reported by the LSP for the active file.

---

## Requirements

### Requirement 1: Streaming AI Responses

**User Story:** As a developer, I want AI responses to stream token-by-token into the chat panel, so that I see output immediately without waiting for the full response.

#### Acceptance Criteria

1. WHEN the IDE sends a message to any Provider, THE IDE SHALL begin rendering response tokens in the chat panel as they arrive, before the full response is complete.
2. WHEN streaming is active, THE ChatSection SHALL display a blinking cursor indicator after the last rendered token.
3. WHEN a streaming response is interrupted by a network error, THE IDE SHALL display the partial response already received and append an error notice.
4. WHEN the Provider is Ollama, THE IDE SHALL use the Ollama streaming API (`stream: true`) and parse newline-delimited JSON chunks.
5. WHEN the Provider is OpenAI, DeepSeek, GLM, or Custom, THE IDE SHALL use the OpenAI-compatible SSE streaming endpoint and parse `data:` lines.
6. WHEN the Provider is Anthropic, THE IDE SHALL use the Anthropic streaming messages API and parse SSE `content_block_delta` events.
7. WHEN the Provider is Gemini, THE IDE SHALL use the Gemini streaming `streamGenerateContent` endpoint.
8. WHEN the Provider is HuggingFace, THE IDE SHALL use the HuggingFace Inference streaming API.
9. THE `callAI` function in `app/lib/ai.ts` SHALL accept an optional `onChunk` callback of type `(chunk: string) => void` and invoke it for each token chunk when provided.
10. FOR ALL Providers, parsing then streaming then collecting all chunks SHALL produce a string equivalent to the non-streaming response for the same input (round-trip property).

---

### Requirement 2: Persistent Terminal with Working Directory Tracking

**User Story:** As a developer, I want a terminal that tracks the current working directory and supports `cd`, so that I can navigate my project and run commands in the correct context.

#### Acceptance Criteria

1. THE Terminal SHALL maintain a `currentDirectory` state variable initialized to the Workspace root when a folder is opened.
2. WHEN the user executes a `cd <path>` command, THE Terminal SHALL resolve the path relative to `currentDirectory` and update `currentDirectory` to the resolved absolute path.
3. WHEN the user executes any non-`cd` command, THE Terminal SHALL pass `cwd: currentDirectory` to the Electron `execute-command` IPC handler.
4. THE Terminal prompt SHALL display the `currentDirectory` path before the `$` symbol.
5. WHEN a command produces output exceeding 10,000 characters, THE Terminal SHALL truncate the display to the last 10,000 characters and prepend a truncation notice.
6. THE Terminal SHALL maintain a command history of the last 100 commands per session.
7. WHEN the user presses the Up or Down arrow key in the Terminal input, THE Terminal SHALL cycle through command history.
8. IF the `execute-command` IPC call returns `success: false`, THEN THE Terminal SHALL display the error output in red text.
9. WHEN the Workspace root changes via `open-folder`, THE Terminal SHALL reset `currentDirectory` to the new Workspace root.

---

### Requirement 3: File Operations — Create, Rename, Delete with Disk Sync

**User Story:** As a developer, I want to create, rename, and delete files and folders directly in the project tree with changes reflected on disk, so that my in-memory tree and actual filesystem stay in sync.

#### Acceptance Criteria

1. WHEN the user right-clicks a folder node in the ProjectTree, THE IDE SHALL display a context menu with options: "New File", "New Folder", "Rename", and "Delete".
2. WHEN the user selects "New File" from the context menu, THE IDE SHALL prompt for a filename, create the file on disk via the `write-file` IPC handler, and add a ProjectItem of type `file` to the project tree.
3. WHEN the user selects "New Folder" from the context menu, THE IDE SHALL prompt for a folder name, create the directory on disk via a new `create-directory` IPC handler, and add a ProjectItem of type `folder` to the project tree.
4. WHEN the user selects "Rename" from the context menu, THE IDE SHALL prompt for a new name, rename the file or folder on disk via a new `rename-path` IPC handler, and update the `name`, `path`, and `diskPath` of the affected ProjectItem and all descendant ProjectItems.
5. WHEN the user selects "Delete" from the context menu and confirms, THE IDE SHALL delete the file or folder on disk via the `delete-file` IPC handler (recursively for folders), and remove the ProjectItem and all descendants from the project tree.
6. IF any disk operation fails, THEN THE IDE SHALL display an error notification and leave the project tree unchanged.
7. WHEN the Agent applies an edit to a file whose `diskPath` is set, THE IDE SHALL automatically persist the new content to disk via `save-file-to-disk` without requiring user action.
8. THE `electron.js` main process SHALL expose a `create-directory` IPC handler that calls `fs.mkdir` with `{ recursive: true }`.
9. THE `electron.js` main process SHALL expose a `rename-path` IPC handler that calls `fs.rename`.

---

### Requirement 4: Multi-File Context Window Management

**User Story:** As a developer, I want to control which files are included in the AI context window, so that I can keep prompts focused and avoid exceeding token limits.

#### Acceptance Criteria

1. THE IDE SHALL display a "Context" badge on each ProjectItem in the ProjectTree indicating whether that file is currently included in the Context_Window.
2. WHEN the user clicks the "Context" badge on a file, THE IDE SHALL toggle that file's inclusion in the `referencedFileIds` list.
3. WHEN building the AI prompt, THE IDE SHALL include only files in `referencedFileIds` as explicit file context, unless `referencedFileIds` is empty, in which case THE IDE SHALL include all open files.
4. THE ChatSection input area SHALL display the count of files currently in context as a pill badge (e.g., "3 files in context").
5. WHEN the estimated token count of the Context_Window exceeds 80% of the selected model's known context limit, THE IDE SHALL display a yellow warning badge in the ChatSection header.
6. THE IDE SHALL compute an estimated token count using the approximation of 4 characters per token.
7. WHEN the user sends a message, THE IDE SHALL include the `referencedFileIds` file contents in the system prompt under a clearly delimited `<context>` XML block.

---

### Requirement 5: LSP Diagnostics Integration in Editor

**User Story:** As a developer, I want real-time error and warning squiggles from Pyright in the Monaco editor, so that I can see Python type errors and undefined references as I type.

#### Acceptance Criteria

1. WHEN the user opens a Python file and the LSP is running, THE Editor SHALL display red squiggles under lines with errors and yellow squiggles under lines with warnings, using Monaco's `editor.setModelMarkers` API.
2. WHEN the LSP sends a `textDocument/publishDiagnostics` notification, THE IDE SHALL convert each diagnostic to a Monaco `IMarkerData` and call `editor.setModelMarkers` for the affected file's model.
3. WHEN the user hovers over a squiggled token, THE Editor SHALL display the diagnostic message in a Monaco hover tooltip.
4. THE StatusBar SHALL display the count of errors and warnings for the active file, updated whenever diagnostics change.
5. WHEN the user opens a file, THE IDE SHALL send a `textDocument/didOpen` LSP notification with the file's URI and content.
6. WHEN the user edits a file in the Editor, THE IDE SHALL send a `textDocument/didChange` LSP notification with the full updated content within 500ms of the last keystroke (debounced).
7. WHEN the user closes a file tab, THE IDE SHALL send a `textDocument/didClose` LSP notification.
8. WHEN the LSP is not running and the user opens a Python file, THE IDE SHALL attempt to start the LSP via the `lsp-start` IPC handler with the current Workspace root.

---

### Requirement 6: AI-Powered Code Actions (Quick Fix, Explain, Refactor)

**User Story:** As a developer, I want to right-click on code or click a lightbulb icon to trigger AI-powered actions like "Explain this", "Fix this error", and "Refactor", so that I can get contextual AI help without switching to the chat panel.

#### Acceptance Criteria

1. WHEN the user selects text in the Editor and right-clicks, THE Editor SHALL display a context menu with AI actions: "Explain Selection", "Refactor Selection", and "Generate Tests for Selection".
2. WHEN the user clicks "Explain Selection", THE IDE SHALL send the selected text and file context to the active Provider and display the response in a floating panel anchored to the selection.
3. WHEN the user clicks "Refactor Selection", THE IDE SHALL send the selected text to the active Provider with a refactor instruction and display the result as a PendingEdit for the active file.
4. WHEN the user clicks "Generate Tests for Selection", THE IDE SHALL send the selected text to the active Provider and display the generated test code as a PendingEdit targeting a new or existing test file.
5. WHEN the LSP reports a diagnostic error on a line, THE Editor SHALL display a lightbulb icon in the gutter of that line.
6. WHEN the user clicks the lightbulb icon, THE IDE SHALL send the error message and surrounding code (±10 lines) to the active Provider with a fix instruction and display the result as a PendingEdit.
7. WHILE a code action request is in flight, THE Editor SHALL display a spinner in the lightbulb gutter icon.

---

### Requirement 7: GitHub Integration — Clone, Status, Commit, Push, Pull

**User Story:** As a developer, I want to clone repositories, view git status, stage files, commit, push, and pull from within the IDE, so that I can manage my entire git workflow without leaving the app.

#### Acceptance Criteria

1. THE GitHubPanel SHALL display a "Clone Repository" input that accepts a GitHub HTTPS or SSH URL and a target local directory path.
2. WHEN the user submits the clone form, THE IDE SHALL execute `git clone <url> <path>` via the Terminal IPC and open the cloned folder as the Workspace on success.
3. THE GitHubPanel SHALL display the current branch name, fetched via `git branch --show-current`.
4. THE GitHubPanel SHALL display a list of changed files with their git status (Modified, Untracked, Staged), fetched via `git status --porcelain`.
5. WHEN the user clicks "Stage All", THE IDE SHALL execute `git add -A` and refresh the git status display.
6. WHEN the user clicks "Stage" on an individual file, THE IDE SHALL execute `git add <filepath>` and refresh the git status display.
7. WHEN the user enters a commit message and clicks "Commit", THE IDE SHALL execute `git commit -m "<message>"` and refresh the git status display.
8. WHEN the user clicks "Push", THE IDE SHALL execute `git push` and display the command output in the GitHubPanel.
9. WHEN the user clicks "Pull", THE IDE SHALL execute `git pull` and display the command output in the GitHubPanel, then reload any files that changed on disk.
10. IF any git command exits with a non-zero code, THEN THE GitHubPanel SHALL display the stderr output as an error message.
11. THE GitHubPanel SHALL refresh the git status automatically every 30 seconds while a Workspace is open.

---

### Requirement 8: Spec / Task Workflow (Kiro-style)

**User Story:** As a developer, I want to create structured feature specs with requirements, design, and tasks inside the IDE, so that I can plan and track AI-assisted development work.

#### Acceptance Criteria

1. THE IDE SHALL provide a "Specs" tab in the Sidebar that lists all spec directories found under `.kiro/specs/` in the current Workspace.
2. WHEN the user clicks "New Spec", THE IDE SHALL prompt for a feature name (kebab-case), create the directory `.kiro/specs/<feature-name>/`, and create a `requirements.md` template file.
3. WHEN the user opens a spec's `requirements.md` in the Editor, THE IDE SHALL display a "Generate Design" button in the EditorSection toolbar.
4. WHEN the user clicks "Generate Design", THE IDE SHALL send the `requirements.md` content to the active Provider and write the AI-generated response to `.kiro/specs/<feature-name>/design.md`.
5. WHEN the user opens a spec's `design.md` in the Editor, THE IDE SHALL display a "Generate Tasks" button in the EditorSection toolbar.
6. WHEN the user clicks "Generate Tasks", THE IDE SHALL send the `design.md` content to the active Provider and write the AI-generated task list to `.kiro/specs/<feature-name>/tasks.md`.
7. WHEN the user opens a spec's `tasks.md` in the Editor, THE IDE SHALL display checkboxes next to each task line matching the pattern `- [ ]` or `- [x]`.
8. WHEN the user clicks a checkbox in `tasks.md`, THE IDE SHALL toggle the `[ ]`/`[x]` state in the file content and save to disk.

---

### Requirement 9: Python and Django Project Analysis

**User Story:** As a developer, I want the IDE to analyze my Python or Django project and surface errors, missing dependencies, and structural issues, so that I can quickly understand the health of the codebase.

#### Acceptance Criteria

1. WHEN the user opens a Workspace containing a `manage.py` file, THE IDE SHALL display a "Django Project" badge in the Sidebar header.
2. WHEN the user clicks "Analyze Project" in the Analyzer tab, THE IDE SHALL scan all `.py` files in the Workspace and send their paths and contents to the active Provider with a structured analysis prompt.
3. THE ProjectAnalyzer SHALL display the analysis result grouped into sections: "Errors", "Warnings", "Suggestions", and "Dependencies".
4. WHEN the analysis identifies a missing `requirements.txt` or `pyproject.toml`, THE IDE SHALL display a "Generate requirements.txt" button that sends the project's import statements to the Provider and writes the result to `requirements.txt`.
5. WHEN the user clicks a file path in the analysis result, THE IDE SHALL open that file in the Editor and scroll to the relevant line if a line number is provided.
6. THE ProjectAnalyzer SHALL display the total count of errors and warnings as summary badges at the top of the analysis panel.
7. WHEN the Workspace contains a `requirements.txt`, THE IDE SHALL display a "Check Installed" button that runs `pip list` and compares the output against `requirements.txt`, highlighting missing packages.

---

### Requirement 10: Settings Panel — Per-Provider Model Configuration

**User Story:** As a developer, I want a dedicated settings panel where I can configure each AI provider independently with its own API key, model, base URL, temperature, and max tokens, so that I can switch providers without re-entering credentials.

#### Acceptance Criteria

1. THE IDE SHALL provide a Settings panel accessible via a gear icon in the Sidebar footer.
2. THE Settings panel SHALL store configuration for each Provider independently, keyed by provider name in `localStorage`.
3. WHEN the user selects a Provider from the dropdown, THE Settings panel SHALL load the previously saved API key, model ID, base URL, temperature, and max tokens for that Provider.
4. THE Settings panel SHALL include a temperature slider with range 0.0–2.0 and step 0.1.
5. THE Settings panel SHALL include a max tokens input with range 256–32,768.
6. WHEN the user clicks "Save" in the Settings panel, THE IDE SHALL persist all fields for the active Provider to `localStorage` and display a success toast notification.
7. WHEN the user clicks "Test Connection", THE IDE SHALL send a minimal test prompt ("Hello") to the active Provider and display "Connected" or the error message returned.
8. WHERE the Provider is Ollama, THE Settings panel SHALL display a "Refresh Models" button that fetches the model list from the Ollama API and populates the model dropdown.
9. THE Settings panel SHALL display the currently active Provider name and model in the Sidebar footer at all times, even when the panel is collapsed.

---

### Requirement 11: Multi-Tab Editor with Unsaved Changes Indicator

**User Story:** As a developer, I want to have multiple files open in tabs with a visual indicator for unsaved changes, so that I can work across files without losing track of what needs saving.

#### Acceptance Criteria

1. THE Editor SHALL support up to 20 simultaneously open file tabs.
2. WHEN a file's in-memory content differs from its last-saved disk content, THE Editor SHALL display a dot indicator on that file's tab.
3. WHEN the user presses Ctrl+S, THE IDE SHALL save the active file to disk via `save-file-to-disk` and clear the unsaved indicator for that tab.
4. WHEN the user attempts to close a tab with unsaved changes, THE IDE SHALL display a confirmation dialog: "Save changes to <filename> before closing?".
5. WHEN the user middle-clicks a tab, THE IDE SHALL close that tab, applying the same unsaved-changes check as criterion 4.
6. THE Editor tab bar SHALL support horizontal scrolling when the number of open tabs exceeds the visible width.
7. WHEN the Agent applies an edit and auto-saves to disk, THE IDE SHALL clear the unsaved indicator for the affected tab.

---

### Requirement 12: Windows .exe Build and Auto-Update Readiness

**User Story:** As a developer, I want to build Kora AI as a Windows `.exe` installer that launches reliably, so that I can distribute and run it on any Windows machine without a development environment.

#### Acceptance Criteria

1. THE `electron-builder.json` configuration SHALL specify `win` as a build target with `nsis` installer format.
2. THE `electron-builder.json` SHALL set `appId` to `com.taskkora.kora-ai`, `productName` to `Kora AI`, and `copyright` to `Copyright © 2026 Taskkora`.
3. THE built `.exe` installer SHALL include all Next.js build output (`.next/` standalone) and Electron binaries.
4. WHEN the packaged app launches, THE `electron.js` main process SHALL start the bundled Next.js server before creating the BrowserWindow.
5. THE `electron-builder.json` SHALL configure `extraResources` to include the `pyright` binary so LSP works without a separate installation.
6. THE `package.json` `electron:build:win` script SHALL run `next build` followed by `electron-builder --win` in sequence.
7. WHEN the app window is closed on Windows, THE `electron.js` main process SHALL terminate the Next.js child process and any LSP server process to prevent orphaned processes.
8. THE `electron-builder.json` SHALL set `output` to `dist-electron` and `directories.buildResources` to `public`.

---

### Requirement 13: Terminal Error Auto-Fix

**User Story:** As a developer, I want the IDE to automatically detect errors in terminal output and fix them using AI, so that I can resolve build errors, runtime exceptions, and failed commands without manually copying error messages into the chat.

#### Acceptance Criteria

1. WHEN a terminal command exits with a non-zero code, THE Terminal SHALL capture the full stderr and stdout output as `terminalErrorOutput`.
2. WHEN Agent mode is ON and `terminalErrorOutput` is non-empty, THE IDE SHALL automatically send the error output along with the relevant project file context to the active Provider with the instruction: "Fix the error shown in this terminal output."
3. WHEN Agent mode is OFF and `terminalErrorOutput` is non-empty, THE Terminal SHALL display a "Fix this error" button inline below the error output.
4. WHEN the user clicks "Fix this error", THE IDE SHALL send the `terminalErrorOutput` and relevant file context to the active Provider and display the result as a PendingEdit in the chat panel.
5. WHEN building the fix prompt, THE IDE SHALL include the last-run command, the full error output, and the contents of any files referenced by filename or path in the error output (e.g., `File "main.py", line 12`).
6. THE IDE SHALL parse common Python traceback patterns (`File "<path>", line <n>`) and Django error pages to extract referenced file paths automatically.
7. WHEN the AI fix response contains one or more EDIT blocks, THE IDE SHALL apply them according to the current Agent mode (auto-apply if ON, show as PendingEdit if OFF).
8. AFTER applying a fix, THE IDE SHALL automatically re-run the last failed command and display the new output in the Terminal.
9. IF the re-run also fails, THE IDE SHALL display a "Retry Fix" button and NOT enter an infinite auto-fix loop — maximum 1 automatic retry per command.
10. THE Terminal SHALL display a visual indicator (spinner + "AI fixing...") while the fix request is in flight.
