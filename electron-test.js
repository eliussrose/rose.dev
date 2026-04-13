const { app, BrowserWindow } = require('electron');

console.log('Electron test starting...');

app.whenReady().then(() => {
  console.log('App ready!');
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });
  
  win.loadURL('https://www.google.com');
  console.log('Window created');
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  app.quit();
});

console.log('Script loaded');
