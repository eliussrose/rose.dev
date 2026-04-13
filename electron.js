const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const { promisify } = require('util');
const execAsync = promisify(exec);

let mainWindow = null;
let serverProcess = null;
const PORT = 3000;
const isDev = !app.isPackaged;

// Prevent multiple error dialogs
let errorShown = false;

// IPC Handlers
ipcMain.handle('execute-command', async (event, command, cwd) => {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: cwd || process.cwd() });
    return { stdout, stderr, error: null };
  } catch (error) {
    return { stdout: '', stderr: error.message, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, error: null };
  } catch (error) {
    return { content: null, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-path', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('save-file-to-disk', async (event, diskPath, content) => {
  try {
    await fs.writeFile(diskPath, content, 'utf-8');
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// LSP handlers (stub)
ipcMain.handle('lsp-start', async () => ({ success: false, error: 'LSP not implemented' }));
ipcMain.handle('lsp-stop', async () => ({ success: true }));
ipcMain.handle('lsp-request', async () => ({ result: null }));
ipcMain.handle('lsp-notification', async () => ({ success: true }));
ipcMain.handle('lsp-status', async () => ({ running: false }));

// MCP handlers (stub)
ipcMain.handle('mcp-start-server', async () => ({ success: false, error: 'MCP not implemented' }));
ipcMain.handle('mcp-stop-server', async () => ({ success: true }));
ipcMain.handle('mcp-send-request', async () => ({ result: null }));

function checkServer(port, maxAttempts = 60) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      http.get(`http://127.0.0.1:${port}`, () => resolve(true))
        .on('error', () => {
          if (attempts < maxAttempts) {
            setTimeout(check, 1000);
          } else {
            resolve(false);
          }
        });
    };
    check();
  });
}

async function startServer() {
  if (isDev) {
    console.log('[Dev Mode] Checking if dev server is running on port', PORT);
    return checkServer(PORT);
  }

  console.log('[Production Mode] Starting standalone server...');
  
  // Try multiple possible paths for the standalone server
  const possiblePaths = [
    // Path 1: ASAR unpacked
    path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone', 'server.js'),
    // Path 2: Direct in resources
    path.join(process.resourcesPath, '.next', 'standalone', 'server.js'),
    // Path 3: Relative to app
    path.join(__dirname, '.next', 'standalone', 'server.js'),
  ];

  let serverScript = null;
  for (const p of possiblePaths) {
    console.log('[Server] Checking path:', p);
    if (fsSync.existsSync(p)) {
      serverScript = p;
      console.log('[Server] Found server at:', p);
      break;
    }
  }

  if (!serverScript) {
    console.error('[Server] server.js not found in any expected location');
    console.error('[Server] Checked paths:', possiblePaths);
    return false;
  }

  // Find Node.js executable
  let nodePath = process.execPath; // Use Electron's Node.js by default
  
  // Try to find bundled node.exe
  const bundledNode = path.join(process.resourcesPath, 'node.exe');
  if (fsSync.existsSync(bundledNode)) {
    nodePath = bundledNode;
    console.log('[Server] Using bundled Node.js:', nodePath);
  } else {
    console.log('[Server] Using Electron Node.js:', nodePath);
  }

  return new Promise((resolve) => {
    try {
      const serverDir = path.dirname(serverScript);
      console.log('[Server] Server directory:', serverDir);
      console.log('[Server] Node path:', nodePath);
      
      serverProcess = spawn(nodePath, [serverScript], {
        cwd: serverDir,
        env: { 
          ...process.env, 
          NODE_ENV: 'production', 
          PORT: String(PORT),
          HOSTNAME: '127.0.0.1'
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      // Log server output
      if (serverProcess.stdout) {
        serverProcess.stdout.on('data', (data) => {
          console.log('[Server Output]', data.toString());
        });
      }
      
      if (serverProcess.stderr) {
        serverProcess.stderr.on('data', (data) => {
          console.error('[Server Error]', data.toString());
        });
      }

      serverProcess.on('error', (err) => {
        console.error('[Server] Spawn error:', err);
        resolve(false);
      });
      
      serverProcess.on('exit', (code, signal) => {
        console.log('[Server] Process exited with code:', code, 'signal:', signal);
        serverProcess = null;
      });

      // Give server time to start, then check
      console.log('[Server] Waiting for server to start...');
      setTimeout(() => {
        checkServer(PORT, 30).then((ready) => {
          if (ready) {
            console.log('[Server] Server is ready!');
          } else {
            console.error('[Server] Server failed to start within timeout');
          }
          resolve(ready);
        });
      }, 3000);
    } catch (err) {
      console.error('[Server] Start exception:', err);
      resolve(false);
    }
  });
}

function createWindow() {
  console.log('[Window] Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0d1117',
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true, // Enable DevTools in production for debugging
    },
  });

  mainWindow.setMenuBarVisibility(false);
  
  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    console.log('[Window] Window ready to show');
    mainWindow.show();
  });
  
  // Log navigation events
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('[Window] Started loading');
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Window] Finished loading');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Window] Failed to load:', errorCode, errorDescription);
  });

  const url = `http://127.0.0.1:${PORT}`;
  console.log('[Window] Loading URL:', url);
  mainWindow.loadURL(url);
  
  // Open DevTools in production for debugging
  if (!isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    console.log('[Window] Window closed');
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const serverReady = await startServer();
  
  if (serverReady) {
    createWindow();
  } else {
    if (!errorShown) {
      errorShown = true;
      dialog.showErrorBox('Server Error', 'Failed to start the application server.');
    }
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
  }
});

// Suppress all uncaught errors to prevent error dialogs
process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
