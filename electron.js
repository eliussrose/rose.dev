const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');

let mainWindow;
let splashWindow;
let nextProcess;
const NEXT_PORT = 3000;
const isDev = process.env.NODE_ENV === 'development';

// Suppress EPIPE errors
process.stdout.on('error', () => {});
process.stderr.on('error', () => {});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile('splash.html');
  splashWindow.center();

  // Auto-close splash after 3 seconds
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  }, 3000);
}

function waitForServer(port, timeout = 60000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        console.log(`[rose.dev] Server ready! Status: ${res.statusCode}`);
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start < timeout) {
          setTimeout(check, 1000);
        } else {
          console.error('[rose.dev] Server timeout');
          resolve(false);
        }
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (Date.now() - start < timeout) {
          setTimeout(check, 1000);
        } else {
          resolve(false);
        }
      });
    };
    check();
  });
}

async function startNextServer() {
  return new Promise((resolve) => {
    console.log('[rose.dev] Starting Next.js server...');
    
    // In dev mode, don't start server (it's already running via npm run dev)
    if (isDev) {
      console.log('[rose.dev] Dev mode - server should be running on port', NEXT_PORT);
      waitForServer(NEXT_PORT, 60000).then((ready) => {
        if (ready) {
          console.log('[rose.dev] Dev server is ready!');
        } else {
          console.error('[rose.dev] Dev server not found. Run "npm run dev" first.');
        }
        resolve();
      });
      return;
    }

    // Production mode - use Next.js standalone server
    const standaloneDir = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone');
    const serverScript = path.join(standaloneDir, 'server.js');
    
    console.log('[rose.dev] Standalone directory:', standaloneDir);
    console.log('[rose.dev] Server script:', serverScript);

    // Find Node.js executable (bundled with Electron)
    const nodePath = process.platform === 'win32' 
      ? process.execPath.replace('rosedev-AI-IDE.exe', 'node.exe')
      : process.execPath;

    console.log('[rose.dev] Node path:', nodePath);

    // Start Next.js standalone server
    nextProcess = spawn('node', [serverScript], {
      cwd: standaloneDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: NEXT_PORT.toString(),
        HOSTNAME: '127.0.0.1',
      },
      shell: false,
    });

    nextProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Next.js]', output.trim());
    });

    nextProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error('[Next.js Error]', output.trim());
    });

    nextProcess.on('error', (err) => {
      console.error('[rose.dev] Failed to start Next.js server:', err.message);
      resolve();
    });

    nextProcess.on('exit', (code, signal) => {
      console.log('[rose.dev] Next.js server exited with code:', code, 'signal:', signal);
      nextProcess = null;
    });

    // Wait for server to be ready
    console.log('[rose.dev] Waiting for Next.js server to start...');
    waitForServer(NEXT_PORT, 60000).then((ready) => {
      if (ready) {
        console.log('[rose.dev] Next.js server is ready!');
      } else {
        console.error('[rose.dev] Next.js server failed to start within timeout');
      }
      resolve();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    backgroundColor: '#0d1117',
    titleBarStyle: 'default',
    frame: true,
    title: 'rose.dev AI IDE',
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[rose.dev] Window shown');
  });

  mainWindow.loadURL(`http://127.0.0.1:${NEXT_PORT}`);

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[rose.dev] Failed to load:', errorCode, errorDescription);
    setTimeout(() => {
      console.log('[rose.dev] Retrying...');
      mainWindow.loadURL(`http://127.0.0.1:${NEXT_PORT}`);
    }, 2000);
  });

  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', async () => {
  console.log('rose.dev AI IDE - Starting...');
  console.log('[rose.dev] isDev:', isDev);
  console.log('[rose.dev] __dirname:', __dirname);
  console.log('[rose.dev] resourcesPath:', process.resourcesPath);
  
  // Show splash screen
  createSplashWindow();
  
  // Start server in background
  await startNextServer();
  
  // Wait a bit for splash animation
  setTimeout(() => {
    createWindow();
  }, 3000);
});

app.on('window-all-closed', () => {
  if (nextProcess) {
    try { 
      nextProcess.kill('SIGTERM');
      setTimeout(() => nextProcess.kill('SIGKILL'), 5000);
    } catch {}
  }
  if (lspServerProcess) { try { lspServerProcess.kill(); } catch {} }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
  if (nextProcess) { try { nextProcess.kill('SIGKILL'); } catch {} }
  if (lspServerProcess) { try { lspServerProcess.kill(); } catch {} }
});

// ── Terminal ──────────────────────────────────────────────────────────────────
ipcMain.handle('execute-command', async (event, command, cwd) => {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, cwd: cwd || process.cwd() });
    let output = '';
    let error = '';
    child.stdout.on('data', (d) => { output += d.toString(); });
    child.stderr.on('data', (d) => { error += d.toString(); });
    child.on('close', (code) => {
      const success = code === 0;
      resolve({ success, output: success ? output : (output + error) });
    });
    child.on('error', (err) => {
      resolve({ success: false, output: err.message });
    });
  });
});

// ── File System ───────────────────────────────────────────────────────────────
ipcMain.handle('read-file', async (event, filePath) => {
  try { return { success: true, content: await fs.readFile(filePath, 'utf-8') }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try { await fs.unlink(filePath); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
  try { await fs.mkdir(dirPath, { recursive: true }); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('rename-path', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (e) {
    if (e.code === 'EXDEV') {
      try { await fs.copyFile(oldPath, newPath); await fs.unlink(oldPath); return { success: true }; }
      catch (e2) { return { success: false, error: e2.message }; }
    }
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths.length) return { success: false, canceled: true };

  const folderPath = result.filePaths[0];
  const items = [];
  const IGNORED = new Set(['node_modules', '.git', '.next', 'dist', 'dist-electron', '__pycache__', '.venv', 'venv']);
  const MAX_SIZE = 500 * 1024;

  async function walk(dir, root) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORED.has(e.name)) continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (e.isDirectory()) {
        items.push({ id: rel, name: e.name, type: 'folder', path: rel, isOpen: false });
        await walk(full, root);
      } else {
        const ext = e.name.split('.').pop() || 'txt';
        let content = '';
        try {
          const stat = await fs.stat(full);
          content = stat.size <= MAX_SIZE ? await fs.readFile(full, 'utf-8') : `// File too large (${Math.round(stat.size/1024)}KB)`;
        } catch {}
        items.push({ id: rel, name: e.name, type: 'file', path: rel, content, language: ext, isOpen: true, diskPath: full });
      }
    }
  }

  await walk(folderPath, folderPath);
  return { success: true, folderPath, items };
});

ipcMain.handle('save-file-to-disk', async (event, diskPath, content) => {
  try { await fs.writeFile(diskPath, content, 'utf-8'); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

// ── LSP ───────────────────────────────────────────────────────────────────────
let lspServerProcess = null;
let lspMessageId = 0;
let lspPendingRequests = new Map();

ipcMain.handle('lsp-start', async (event, options) => {
  if (lspServerProcess) return { success: true, message: 'Server already running' };
  try {
    lspServerProcess = spawn(options.serverPath || 'pyright-langserver', ['--stdio'], {
      cwd: options.workspaceRoot || process.cwd(),
      env: { ...process.env, PYTHONPATH: options.pythonPath || process.env.PYTHONPATH },
    });
    let buffer = '';
    lspServerProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      while (true) {
        const end = buffer.indexOf('\r\n\r\n');
        if (end === -1) break;
        const match = buffer.substring(0, end).match(/Content-Length: (\d+)/);
        if (!match) { buffer = buffer.substring(end + 4); continue; }
        const len = parseInt(match[1]), start = end + 4;
        if (buffer.length < start + len) break;
        try { handleLSPMessage(JSON.parse(buffer.substring(start, start + len))); } catch {}
        buffer = buffer.substring(start + len);
      }
    });
    lspServerProcess.stderr.on('data', (d) => console.error('[LSP]', d.toString()));
    lspServerProcess.on('exit', (code) => { lspServerProcess = null; mainWindow?.webContents.send('lsp-server-exit', code); });
    const initResult = await sendLSPRequest('initialize', {
      processId: process.pid,
      rootUri: `file://${options.workspaceRoot || process.cwd()}`,
      capabilities: { textDocument: { completion: { completionItem: { snippetSupport: true } }, hover: { contentFormat: ['markdown', 'plaintext'] }, definition: { linkSupport: true } } },
    });
    sendLSPNotification('initialized', {});
    return { success: true, serverInfo: { pid: lspServerProcess.pid, capabilities: initResult.capabilities || {} } };
  } catch (e) { lspServerProcess?.kill(); lspServerProcess = null; return { success: false, error: e.message }; }
});

ipcMain.handle('lsp-stop', async () => {
  if (!lspServerProcess) return { success: true };
  try { await sendLSPRequest('shutdown', {}); sendLSPNotification('exit', {}); } catch {}
  lspServerProcess?.kill('SIGKILL'); lspServerProcess = null;
  return { success: true };
});

ipcMain.handle('lsp-request', async (event, method, params) => {
  if (!lspServerProcess) return { success: false, error: 'Server not running' };
  try { return { success: true, result: await sendLSPRequest(method, params) }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('lsp-notification', async (event, method, params) => {
  if (!lspServerProcess) return { success: false, error: 'Server not running' };
  sendLSPNotification(method, params); return { success: true };
});

ipcMain.handle('lsp-status', async () => ({ success: true, isRunning: lspServerProcess !== null }));

function sendLSPRequest(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++lspMessageId;
    const timeout = setTimeout(() => { lspPendingRequests.delete(id); reject(new Error(`Timeout: ${method}`)); }, 5000);
    lspPendingRequests.set(id, { resolve, reject, timeout });
    sendLSPMessage({ jsonrpc: '2.0', id, method, params });
  });
}
function sendLSPNotification(method, params) { sendLSPMessage({ jsonrpc: '2.0', method, params }); }
function sendLSPMessage(message) {
  if (!lspServerProcess?.stdin) throw new Error('LSP stdin not available');
  const content = JSON.stringify(message);
  lspServerProcess.stdin.write(`Content-Length: ${Buffer.byteLength(content)}\r\n\r\n${content}`);
}
function handleLSPMessage(message) {
  if ('id' in message) {
    const p = lspPendingRequests.get(message.id);
    if (p) { clearTimeout(p.timeout); lspPendingRequests.delete(message.id); message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result); }
  } else if (message.method) { mainWindow?.webContents.send('lsp-notification', message.method, message.params); }
}

// ── MCP Support ───────────────────────────────────────────────────────────────
const mcpServers = new Map();

ipcMain.handle('mcp-start-server', async (event, config) => {
  try {
    const { id, command, args, env } = config;
    if (mcpServers.has(id)) {
      return { success: true, message: 'Server already running', pid: mcpServers.get(id).pid };
    }
    const serverProcess = spawn(command, args || [], {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    mcpServers.set(id, { process: serverProcess, pid: serverProcess.pid, buffer: '' });
    serverProcess.on('error', (err) => { console.error(`[MCP ${id}]`, err); mcpServers.delete(id); });
    serverProcess.on('exit', (code) => { console.log(`[MCP ${id}] Exit:`, code); mcpServers.delete(id); });
    return { success: true, pid: serverProcess.pid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp-stop-server', async (event, { serverId }) => {
  try {
    const server = mcpServers.get(serverId);
    if (!server) return { success: true, message: 'Server not running' };
    server.process.kill();
    mcpServers.delete(serverId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp-send-request', async (event, { serverId, message }) => {
  try {
    const server = mcpServers.get(serverId);
    if (!server) return { error: { code: -1, message: 'Server not running' } };
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve({ error: { code: -1, message: 'Timeout' } }), 30000);
      const messageStr = JSON.stringify(message);
      server.process.stdin.write(`Content-Length: ${Buffer.byteLength(messageStr)}\r\n\r\n${messageStr}`);
      const onData = (data) => {
        server.buffer += data.toString();
        const headerEnd = server.buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;
        const headerMatch = server.buffer.substring(0, headerEnd).match(/Content-Length: (\d+)/);
        if (!headerMatch) return;
        const contentLength = parseInt(headerMatch[1]);
        const messageStart = headerEnd + 4;
        if (server.buffer.length < messageStart + contentLength) return;
        const messageContent = server.buffer.substring(messageStart, messageStart + contentLength);
        server.buffer = server.buffer.substring(messageStart + contentLength);
        try {
          const response = JSON.parse(messageContent);
          clearTimeout(timeout);
          server.process.stdout.removeListener('data', onData);
          resolve(response);
        } catch (err) { console.error('[MCP] Parse error:', err); }
      };
      server.process.stdout.on('data', onData);
    });
  } catch (error) {
    return { error: { code: -1, message: error.message } };
  }
});

console.log('[rose.dev] MCP support initialized');
