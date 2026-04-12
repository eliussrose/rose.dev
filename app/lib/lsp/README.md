# LSP Library

This directory contains the Language Server Protocol (LSP) implementation for Kora AI IDE.

## Structure

```
app/lib/lsp/
├── index.ts          # Main exports
├── types.ts          # TypeScript type definitions
├── config.ts         # Configuration and settings
├── utils.ts          # Utility functions
├── server-manager.ts # LSP server manager ✅
├── client.ts         # LSP client (to be implemented)
└── monaco.ts         # Monaco integration (to be implemented)
```

## Files

### `types.ts` ✅
- LSP protocol type definitions
- Position, Range, Diagnostic, etc.
- Matches LSP specification

### `config.ts` ✅
- Default LSP configuration
- Server settings
- Django detection patterns
- Configuration persistence

### `utils.ts` ✅
- Position/range conversion (Monaco ↔ LSP)
- Diagnostic conversion
- Message formatting
- Helper functions

### `server-manager.ts` ✅ NEW
- Manages Pyright language server lifecycle
- Handles server start/stop/restart
- JSON-RPC message routing
- Connection error handling and recovery
- Automatic reconnection on crashes
- Event-based architecture

### `index.ts` ✅
- Main module exports
- Version information
- Feature flags

## Usage

### Server Manager (Backend)

```typescript
import { LSPServerManager } from '@/lib/lsp';

// Create manager
const manager = new LSPServerManager({
  workspaceRoot: '/path/to/project',
  pythonPath: '/usr/bin/python3',
  debug: true,
});

// Start server
const serverInfo = await manager.startServer();
console.log('Server started:', serverInfo);

// Send request
const completions = await manager.sendRequest('textDocument/completion', {
  textDocument: { uri: 'file:///path/to/file.py' },
  position: { line: 10, character: 5 },
});

// Send notification
manager.sendNotification('textDocument/didOpen', {
  textDocument: {
    uri: 'file:///path/to/file.py',
    languageId: 'python',
    version: 1,
    text: 'print("hello")',
  },
});

// Listen to events
manager.on('serverStart', (info) => console.log('Started:', info));
manager.on('serverStop', () => console.log('Stopped'));
manager.on('serverError', (error) => console.error('Error:', error));
manager.on('statusChange', (status) => console.log('Status:', status));
manager.on('notification', (method, params) => {
  console.log('Notification:', method, params);
});

// Stop server
await manager.stopServer();
```

### API Route (Web)

```typescript
// Start server
const response = await fetch('/api/lsp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'start',
    workspaceRoot: '/path/to/project',
  }),
});

// Send request
const response = await fetch('/api/lsp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'request',
    workspaceRoot: '/path/to/project',
    method: 'textDocument/completion',
    params: { /* ... */ },
  }),
});

// Get status
const response = await fetch('/api/lsp?workspaceRoot=/path/to/project');
```

### Electron (Desktop)

```typescript
// Start server
const result = await window.electron.lsp.start({
  workspaceRoot: '/path/to/project',
  pythonPath: '/usr/bin/python3',
});

// Send request
const result = await window.electron.lsp.request('textDocument/completion', {
  textDocument: { uri: 'file:///path/to/file.py' },
  position: { line: 10, character: 5 },
});

// Listen to notifications
window.electron.lsp.onNotification((method, params) => {
  console.log('Notification:', method, params);
});

// Listen to server events
window.electron.lsp.onServerExit((code) => {
  console.log('Server exited:', code);
});

window.electron.lsp.onServerError((error) => {
  console.error('Server error:', error);
});

// Stop server
await window.electron.lsp.stop();
```

## Completed Tasks

- ✅ Task 1: Setup LSP Infrastructure
  - Types, config, utils implemented
  - Dependencies added to package.json

- ✅ Task 2: Implement LSP Manager (Backend)
  - Server process management
  - Message routing (JSON-RPC)
  - Connection error handling
  - Automatic reconnection
  - API route for web mode
  - Electron IPC for desktop mode

## Next Steps

1. ✅ Task 2.1: Create LSP manager class
2. ✅ Task 2.3: Implement message routing
3. ✅ Task 2.5: Add connection error handling
4. ⏭️ Task 3: Checkpoint - Verify LSP Manager
5. ⏭️ Task 4: Implement LSP Client (Frontend)

## Dependencies

- `monaco-languageclient` - Monaco LSP client
- `vscode-languageclient` - LSP client protocol
- `vscode-languageserver-protocol` - LSP protocol types
- `pyright` - Python language server

## Testing

Unit tests will be added in `__tests__/` directory.

## Documentation

See the main spec at `.kiro/specs/lsp-integration/` for detailed requirements and design.
