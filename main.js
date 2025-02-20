const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false // Change this to false for security
        }
    });

    const startURL = url.format({
        pathname: path.join(__dirname, 'build', 'index.html'),
        protocol: 'file:',
        slashes: true
    });

    win.loadURL(startURL);

    // Open DevTools for debugging
   // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
