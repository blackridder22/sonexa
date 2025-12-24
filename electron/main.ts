import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { createApplicationMenu } from './menu';
import { getSettings, setSettings, AppSettings } from './settings';
import { getSecret, setSecret, deleteSecret } from './secrets';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 },
        backgroundColor: '#0f0f23',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    // Set up the application menu
    createApplicationMenu(mainWindow);

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ============================================
// IPC Handlers
// ============================================

// App info
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// Settings (electron-store)
ipcMain.handle('get-settings', () => {
    return getSettings();
});

ipcMain.handle('set-settings', (_event, settings: Partial<AppSettings>) => {
    setSettings(settings);
    return { success: true };
});

// Secrets (keytar)
ipcMain.handle('get-secret', async (_event, key: string) => {
    return await getSecret(key);
});

ipcMain.handle('set-secret', async (_event, key: string, value: string) => {
    await setSecret(key, value);
    return { success: true };
});

ipcMain.handle('delete-secret', async (_event, key: string) => {
    return await deleteSecret(key);
});

// File dialog for choosing library path
ipcMain.handle('choose-directory', async () => {
    if (!mainWindow) return null;

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose Library Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    return result.filePaths[0];
});

// Export mainWindow for menu access
export { mainWindow };

