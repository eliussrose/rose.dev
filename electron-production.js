const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let serverProcess;
const PORT = 3000;
const isDev = !app.isPackaged;

console.log('='.repeat(80));
console.log('rose.dev AI IDE Starting...');
console.log('Mode:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('='.repeat(80));

// Check if server is ready
function waitForServer(port, timeout = 60000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      http.get(`http://127.0.0.1:${port}`, () => {
        console.log('Server ready on port', port);
        resolve(true);
      }).on('error', () => {
        if (Date.now() - start < timeout) {
          setTimeout(check, 1000);
        } else {
          console.log('Server timeout');
          resolve(false);
        }
      });
    };
    check();
  });
}

// Start Next.js server
async function startServer() {
  if (isDev) {
    console.log('Development mode - expecting dev server');
    return waitForServer(PORT);
  }

  console.log('Production mode - starting server...');
  
  const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone', 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log('Server not found at:', serverPath);
    return false;
  }

  console.log('Server found at:', serverPath);

  return new Promise((resolve) => {
    const serverDir = path.dirname(serverPath);
    
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: serverDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(PORT),
        HOSTNAME: '127.0.0.1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    console.log('Server process started, PID:', serverProcess.pid);

    serverProcess.stdout.on('data', (data) => {
      console.log('[Server]', data.toString().trim());
    });

    serverProcess.stderr.on('data', (data) => {
      console.log('[Server Error]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.log('Server error:', err.message);
      resolve(false);
    });

    serverProcess.on('exit', (code) => {
      console.log('Server exited, code:', code);
      serverProcess = null;
    });

    setTimeout(() => {
      waitForServer(PORT, 45000).then(resolve);
    }, 2000);
  });
}

// Create main window
function createMainWindow() {
  console.log('Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);

  const url = `http://127.0.0.1:${PORT}`;
  console.log('Loading URL:', url);
  
  mainWindow.loadURL(url);

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Main app startup
async function startApp() {
  console.log('App starting...');
  
  const serverReady = await startServer();
  
  if (!serverReady) {
    console.log('CRITICAL: Server failed to start!');
  } else {
    console.log('Server started successfully');
  }
  
  createMainWindow();
}

// App events
app.on('ready', startApp);

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }
});

console.log('Electron main script loaded');
