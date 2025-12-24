import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { createApplicationMenu } from './menu';
import { getSettings, setSettings, AppSettings } from './settings';
import { getSecret, setSecret, deleteSecret } from './secrets';
import { initDatabase, insertFile, getAllFiles, getFilesByType, getFileByHash, deleteAllFiles, FileRecord } from '../native/db';
import { isAudioFile, detectFileType, copyFileToLibrary, getAudioMetadata, clearLibrary } from '../native/storage';

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
    // Initialize database
    initDatabase();

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

// ============================================
// File Import Handlers
// ============================================

// Import files from paths
ipcMain.handle('import-files', async (_event, filePaths: string[]) => {
    const results: { success: FileRecord[]; failed: string[]; duplicates: string[] } = {
        success: [],
        failed: [],
        duplicates: [],
    };

    for (const sourcePath of filePaths) {
        try {
            // Check if it's an audio file
            if (!isAudioFile(sourcePath)) {
                results.failed.push(sourcePath);
                continue;
            }

            // Get metadata first to check for duplicates
            const metadata = await getAudioMetadata(sourcePath);

            // Check for duplicate by hash
            const existing = getFileByHash(metadata.hash);
            if (existing) {
                results.duplicates.push(sourcePath);
                continue;
            }

            // Detect file type (music or sfx)
            const originalFilename = path.basename(sourcePath);
            const fileType = detectFileType(originalFilename);

            // Copy file to library
            const { destPath, filename } = await copyFileToLibrary(sourcePath, fileType);

            // Insert into database
            const record = insertFile({
                filename: originalFilename,
                type: fileType,
                path: destPath,
                hash: metadata.hash,
                duration: metadata.duration,
                size: metadata.size,
                tags: '[]',
                bpm: null,
                cloud_url: null,
                cloud_id: null,
            });

            results.success.push(record);

            // Notify renderer of progress
            if (mainWindow) {
                mainWindow.webContents.send('import-progress', {
                    current: results.success.length + results.failed.length + results.duplicates.length,
                    total: filePaths.length,
                    filename: originalFilename,
                });
            }
        } catch (error) {
            console.error('Failed to import file:', sourcePath, error);
            results.failed.push(sourcePath);
        }
    }

    return results;
});

// List all files
ipcMain.handle('list-files', (_event, type?: 'music' | 'sfx') => {
    if (type) {
        return getFilesByType(type);
    }
    return getAllFiles();
});

// Delete cache (files + database)
ipcMain.handle('delete-cache', async () => {
    const filesDeleted = await clearLibrary();
    const recordsDeleted = deleteAllFiles();
    return { filesDeleted, recordsDeleted };
});

// Export mainWindow for menu access
export { mainWindow };


