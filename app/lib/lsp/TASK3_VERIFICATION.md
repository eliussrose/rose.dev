# Task 3: LSP Manager Verification Guide

## 📋 Checkpoint Overview

Task 3 হল একটি verification checkpoint যেখানে আমরা নিশ্চিত করব যে LSP Manager সঠিকভাবে কাজ করছে।

## ✅ Verification Checklist

### 1. Code Review (Manual)

#### Server Manager (`app/lib/lsp/server-manager.ts`)
- ✅ LSPServerManager class properly extends EventEmitter
- ✅ Constructor accepts ServerManagerOptions
- ✅ startServer() spawns Pyright process
- ✅ stopServer() sends shutdown → exit sequence
- ✅ sendRequest() implements JSON-RPC with timeout
- ✅ sendNotification() sends without expecting response
- ✅ Message parsing handles Content-Length headers
- ✅ Automatic reconnection on crash (max 3 attempts)
- ✅ Event emission: serverStart, serverStop, serverError, statusChange
- ✅ Cleanup on process exit

#### API Route (`app/api/lsp/route.ts`)
- ✅ POST /api/lsp handles: start, stop, status, request, notification
- ✅ GET /api/lsp returns server status
- ✅ DELETE /api/lsp stops server
- ✅ Global server manager instance (singleton pattern)
- ✅ Error handling with try-catch
- ✅ Proper HTTP status codes (400, 500, 503)

#### Electron Integration (`electron.js`)
- ✅ IPC handlers: lsp-start, lsp-stop, lsp-request, lsp-notification, lsp-status
- ✅ Message buffering and parsing
- ✅ Request/response matching by ID
- ✅ Event forwarding to renderer: lsp-notification, lsp-server-exit, lsp-server-error
- ✅ Timeout handling (5 seconds)

#### Preload Bridge (`preload.js`)
- ✅ window.electron.lsp API exposed
- ✅ Methods: start, stop, request, notification, status
- ✅ Event listeners: onNotification, onServerExit, onServerError

#### TypeScript Types (`types/electron.d.ts`)
- ✅ LSPAPI interface defined
- ✅ LSPServerOptions, LSPServerInfo types
- ✅ Proper Promise return types

### 2. Prerequisites Check

আপনার সিস্টেমে এগুলো ইনস্টল থাকতে হবে:

```bash
# Node.js check
node --version  # Should show v20.x.x or higher

# npm check
npm --version   # Should show 10.x.x or higher

# Python check (optional, for Pyright)
python --version  # Should show Python 3.8+
```

### 3. Installation Test

```bash
# Project directory-তে যান
cd C:\Users\MHCL107\Desktop\rose.dev

# Dependencies install করুন
npm install

# Check করুন Pyright install হয়েছে কিনা
npx pyright --version
```

Expected output:
```
pyright 1.1.350
```

### 4. Development Server Test

```bash
# Development server চালান
npm run dev
```

Expected output:
```
▲ Next.js 16.2.1
- Local:        http://localhost:3000
- Ready in 2.5s
```

### 5. Browser Mode Testing

Browser-এ http://localhost:3000 খুলে Console-এ এই code চালান:

#### Test 1: Start Server

```javascript
const response = await fetch('/api/lsp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'start',
    workspaceRoot: 'C:\\Users\\MHCL107\\Desktop\\rose.dev',
  }),
});
const data = await response.json();
console.log('Start result:', data);
```

Expected output:
```javascript
{
  success: true,
  serverInfo: {
    pid: 12345,
    version: "1.1.350",
    capabilities: { ... }
  },
  status: "connected"
}
```

#### Test 2: Check Status

```javascript
const response = await fetch('/api/lsp?workspaceRoot=C:\\Users\\MHCL107\\Desktop\\rose.dev');
const data = await response.json();
console.log('Status:', data);
```

Expected output:
```javascript
{
  success: true,
  isRunning: true,
  status: "connected"
}
```

#### Test 3: Send Request (Completion)

```javascript
const response = await fetch('/api/lsp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'request',
    workspaceRoot: 'C:\\Users\\MHCL107\\Desktop\\rose.dev',
    method: 'textDocument/completion',
    params: {
      textDocument: { uri: 'file:///C:/Users/MHCL107/Desktop/rose.dev/test.py' },
      position: { line: 0, character: 0 },
    },
  }),
});
const data = await response.json();
console.log('Completion result:', data);
```

Expected output:
```javascript
{
  success: true,
  result: {
    items: [
      { label: "print", kind: 3, ... },
      { label: "import", kind: 14, ... },
      // ... more completions
    ]
  }
}
```

#### Test 4: Stop Server

```javascript
const response = await fetch('/api/lsp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'stop',
    workspaceRoot: 'C:\\Users\\MHCL107\\Desktop\\rose.dev',
  }),
});
const data = await response.json();
console.log('Stop result:', data);
```

Expected output:
```javascript
{
  success: true,
  message: "Server stopped",
  status: "disconnected"
}
```

### 6. Desktop Mode Testing

Desktop app চালান:

```bash
npm run electron:dev
```

Console-এ এই code চালান:

#### Test 1: Check Electron API

```javascript
console.log('Electron API:', window.electron);
console.log('LSP API:', window.electron?.lsp);
```

Expected output:
```javascript
{
  executeCommand: ƒ,
  readFile: ƒ,
  writeFile: ƒ,
  lsp: {
    start: ƒ,
    stop: ƒ,
    request: ƒ,
    notification: ƒ,
    status: ƒ,
    onNotification: ƒ,
    onServerExit: ƒ,
    onServerError: ƒ
  },
  platform: "win32",
  isElectron: true
}
```

#### Test 2: Start Server

```javascript
const result = await window.electron.lsp.start({
  workspaceRoot: 'C:\\Users\\MHCL107\\Desktop\\rose.dev',
});
console.log('Start result:', result);
```

Expected output:
```javascript
{
  success: true,
  serverInfo: {
    pid: 12345,
    version: "1.1.350",
    capabilities: { ... }
  }
}
```

#### Test 3: Send Request

```javascript
const result = await window.electron.lsp.request('textDocument/completion', {
  textDocument: { uri: 'file:///C:/Users/MHCL107/Desktop/rose.dev/test.py' },
  position: { line: 0, character: 0 },
});
console.log('Completion result:', result);
```

#### Test 4: Listen to Events

```javascript
window.electron.lsp.onNotification((method, params) => {
  console.log('Notification:', method, params);
});

window.electron.lsp.onServerExit((code) => {
  console.log('Server exited with code:', code);
});

window.electron.lsp.onServerError((error) => {
  console.error('Server error:', error);
});
```

#### Test 5: Stop Server

```javascript
const result = await window.electron.lsp.stop();
console.log('Stop result:', result);
```

### 7. Error Handling Tests

#### Test 1: Start Server Twice

```javascript
// First start
await window.electron.lsp.start({ workspaceRoot: '...' });

// Second start (should return "already running")
const result = await window.electron.lsp.start({ workspaceRoot: '...' });
console.log(result); // { success: true, message: "Server already running" }
```

#### Test 2: Request Without Server

```javascript
// Make sure server is stopped
await window.electron.lsp.stop();

// Try to send request
const result = await window.electron.lsp.request('textDocument/completion', {});
console.log(result); // { success: false, error: "Server not running" }
```

#### Test 3: Invalid Workspace Root

```javascript
const result = await window.electron.lsp.start({
  workspaceRoot: '/invalid/path/that/does/not/exist',
});
console.log(result); // Should handle gracefully
```

### 8. Message Routing Test

একটি Python file তৈরি করুন এবং LSP server-এর সাথে interact করুন:

```javascript
// 1. Start server
await window.electron.lsp.start({
  workspaceRoot: 'C:\\Users\\MHCL107\\Desktop\\rose.dev',
});

// 2. Open document
await window.electron.lsp.notification('textDocument/didOpen', {
  textDocument: {
    uri: 'file:///C:/Users/MHCL107/Desktop/rose.dev/test.py',
    languageId: 'python',
    version: 1,
    text: 'import os\nprint(os.',
  },
});

// 3. Request completion
const result = await window.electron.lsp.request('textDocument/completion', {
  textDocument: { uri: 'file:///C:/Users/MHCL107/Desktop/rose.dev/test.py' },
  position: { line: 1, character: 9 }, // After "os."
});
console.log('Completions:', result.result);

// 4. Close document
await window.electron.lsp.notification('textDocument/didClose', {
  textDocument: {
    uri: 'file:///C:/Users/MHCL107/Desktop/rose.dev/test.py',
  },
});
```

Expected: Should see completions like `path`, `getcwd`, `listdir`, etc.

### 9. Performance Test

```javascript
// Measure request time
const start = performance.now();
const result = await window.electron.lsp.request('textDocument/completion', {
  textDocument: { uri: 'file:///C:/Users/MHCL107/Desktop/rose.dev/test.py' },
  position: { line: 0, character: 0 },
});
const end = performance.now();
console.log(`Request took ${end - start}ms`);
```

Expected: Should be < 100ms for small files

### 10. Reconnection Test

```javascript
// 1. Start server
await window.electron.lsp.start({ workspaceRoot: '...' });

// 2. Get server PID
const status = await window.electron.lsp.status();
console.log('Server PID:', status);

// 3. Kill server process manually (simulate crash)
// On Windows: taskkill /F /PID <pid>
// On Linux/Mac: kill -9 <pid>

// 4. Wait for reconnection
// Check console logs for reconnection attempts

// 5. Try to send request after reconnection
const result = await window.electron.lsp.request('textDocument/completion', {
  textDocument: { uri: 'file:///...' },
  position: { line: 0, character: 0 },
});
console.log('After reconnection:', result);
```

Expected: Server should reconnect automatically within 2-6 seconds

## 🎯 Success Criteria

Task 3 সফল হবে যদি:

1. ✅ Server starts without errors
2. ✅ Server stops gracefully
3. ✅ Message routing works (requests get responses)
4. ✅ Status API returns correct information
5. ✅ Both browser and desktop modes work
6. ✅ Error handling works properly
7. ✅ Reconnection works on crash
8. ✅ No memory leaks or orphaned processes

## 🐛 Common Issues

### Issue 1: "pyright-langserver not found"

**Solution:**
```bash
# Install pyright globally
npm install -g pyright

# Or use local installation
npx pyright-langserver --stdio
```

### Issue 2: "Server not starting"

**Check:**
1. Python installed? `python --version`
2. Pyright installed? `npx pyright --version`
3. Workspace path correct?
4. Check console logs for errors

### Issue 3: "Request timeout"

**Possible causes:**
1. Server not responding (check if process is running)
2. Invalid request format
3. Server crashed (check logs)

### Issue 4: "Port already in use" (Browser mode)

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

## 📝 Verification Report

Node.js ইনস্টল করার পর এই checklist পূরণ করুন:

- [ ] Node.js installed and verified
- [ ] npm install successful
- [ ] Pyright installed
- [ ] Development server starts
- [ ] Browser mode: Server starts
- [ ] Browser mode: Status check works
- [ ] Browser mode: Request/response works
- [ ] Browser mode: Server stops
- [ ] Desktop mode: Electron API available
- [ ] Desktop mode: Server starts
- [ ] Desktop mode: Request/response works
- [ ] Desktop mode: Events work
- [ ] Desktop mode: Server stops
- [ ] Error handling works
- [ ] Reconnection works
- [ ] No orphaned processes

## ⏭️ Next Steps

যদি সব tests pass করে:
- ✅ Task 3 complete!
- ⏭️ Move to Task 4: Implement LSP Client (Frontend)

যদি কোন issue থাকে:
- 🐛 Debug and fix issues
- 📝 Document problems
- 🔄 Re-test after fixes

---

**Current Status:** Waiting for Node.js installation

**Ready to test?** Node.js ইনস্টল করুন, তারপর এই guide follow করুন! 🚀
