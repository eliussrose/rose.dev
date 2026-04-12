const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,

  // Terminal
  executeCommand: (command, cwd) => ipcRenderer.invoke('execute-command', command, cwd),

  // File system
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  renamePath: (oldPath, newPath) => ipcRenderer.invoke('rename-path', oldPath, newPath),

  // Open folder from disk (native dialog)
  openFolder: () => ipcRenderer.invoke('open-folder'),

  // Save file back to its original disk path
  saveFileToDisk: (diskPath, content) => ipcRenderer.invoke('save-file-to-disk', diskPath, content),

  // LSP
  lsp: {
    start: (options) => ipcRenderer.invoke('lsp-start', options),
    stop: () => ipcRenderer.invoke('lsp-stop'),
    request: (method, params) => ipcRenderer.invoke('lsp-request', method, params),
    notification: (method, params) => ipcRenderer.invoke('lsp-notification', method, params),
    status: () => ipcRenderer.invoke('lsp-status'),
    onNotification: (callback) => {
      ipcRenderer.on('lsp-notification', (event, method, params) => callback(method, params));
    },
    onServerExit: (callback) => {
      ipcRenderer.on('lsp-server-exit', (event, code) => callback(code));
    },
    onServerError: (callback) => {
      ipcRenderer.on('lsp-server-error', (event, error) => callback(error));
    },
  },

  // MCP (Model Context Protocol)
  mcpStartServer: (config) => ipcRenderer.invoke('mcp-start-server', config),
  mcpStopServer: (config) => ipcRenderer.invoke('mcp-stop-server', config),
  mcpSendRequest: (config) => ipcRenderer.invoke('mcp-send-request', config),
});
