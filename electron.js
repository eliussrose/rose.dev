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
    return checkServer(PORT);
  }

  const serverScript = path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    '.next',
    'standalone',
    'server.js'
  );

  if (!fsSync.existsSync(serverScript)) {
    return false;
  }

  return new Promise((resolve) => {
    try {
      // Find node.exe - it should be in PATH
      const nodePath = process.platform === 'win32' ? 'node.exe' : 'node';
      
      serverProcess = spawn(nodePath, [serverScript], {
        cwd: path.dirname(serverScript),
        env: { 
          ...process.env, 
          NODE_ENV: 'production', 
          PORT: String(PORT),
          HOSTNAME: '0.0.0.0'
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      // Log server output for debugging
      if (serverProcess.stdout) {
        serverProcess.stdout.on('data', (data) => {
          console.log('[Server]', data.toString());
        });
      }
      
      if (serverProcess.stderr) {
        serverProcess.stderr.on('data', (data) => {
          console.log('[Server Error]', data.toString());
        });
      }

      serverProcess.on('error', (err) => {
        console.log('Server spawn error:', err);
        resolve(false);
      });
      
      serverProcess.on('exit', (code) => {
        console.log('Server exited with code:', code);
        serverProcess = null;
      });

      // Wait longer for server to start
      setTimeout(() => {
        checkServer(PORT, 50).then(resolve);
      }, 5000);
    } catch (err) {
      console.log('Server start exception:', err);
      resolve(false);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  
  mainWindow.on('closed', () => {
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
