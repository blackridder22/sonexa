import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import path from 'path';
import { createApplicationMenu } from './menu';
import { getSettings, setSettings, AppSettings } from './settings';
import { getSecret, setSecret, deleteSecret } from './secrets';
import { initDatabase, insertFile, getAllFiles, getFilesByType, getFavorites, getFileByHash, getFileById, updateFile, deleteFile, deleteAllFiles, FileRecord } from '../native/db';
import { isAudioFile, detectFileType, copyFileToLibrary, getAudioMetadata, clearLibrary, initWorker } from '../native/storage';
import { initSyncQueue, queueSyncOperation, getPendingItems, markProcessing, markCompleted, markFailed, getQueueStats, resetStuckItems, isQueued } from '../native/syncQueue';
import { startWatcher, stopWatcher, restartWatcher } from '../native/watcher';

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
            webSecurity: false, // Allow loading local audio files
        },
    });

    // Set up the application menu
    createApplicationMenu(mainWindow);

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // DevTools can be opened manually with Cmd+Option+I
        // mainWindow.webContents.openDevTools();
    } else {
        // In production: __dirname is dist-electron/electron/
        // index.html is in dist/
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Set app name for dev environment immediately
if (!app.isPackaged) {
    app.setName('Sonexa');
}

app.whenReady().then(() => {
    // Determine the correct path for the gold icon for the About panel
    const aboutIconPath = getIconPath('Icon-macOS-Gold-1024x1024@1x.png');

    // Configure About Panel
    app.setAboutPanelOptions({
        applicationName: 'Sonexa',
        applicationVersion: app.getVersion(),
        version: app.getVersion(),
        copyright: 'Copyright © 2025 Sonexa Team',
        credits: 'Sonexa is an Open Source Project',
        website: 'https://github.com/sonexa/sonexa',
        iconPath: aboutIconPath, // Set the gold icon
    });

    // Initialize database
    initDatabase();

    // Initialize sync queue
    initSyncQueue();
    resetStuckItems(); // Reset any items stuck from previous crash

    // Initialize worker thread for off-main-thread processing
    initWorker();

    // Set initial dock icon
    updateDockIcon();

    createWindow();

    // Start file system watcher for library folder
    startWatcher(mainWindow);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
            startWatcher(mainWindow);
        }
    });
});

app.on('window-all-closed', () => {
    stopWatcher();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ============================================
// Theme & Dock Icon Logic
// ============================================

// Helper to get robust icon path
function getIconPath(filename: string): string {
    // In dev, we are in electron/main.ts (compiled to dist-electron/electron/main.js)
    // We want to access public/logo/filename

    if (app.isPackaged) {
        // In production, resources are usually in resources/app.asar/ ... or unpacked.
        // Assuming electron-builder copies public to resources or we access it from asar.
        // Standard electron-builder puts 'extraResources' or 'files' in resources.
        // But simply accessing __dirname + relative path inside ASAR often works for readFileSync,
        // but dock.setIcon might expect an absolute path on disk.

        // Strategy A: Try path from __dirname (inside asar) -> often resolves securely
        return path.join(__dirname, '../public/logo', filename);
    } else {
        // In dev: dist-electron/electron/main.js -> ../../public/logo/filename
        return path.join(__dirname, '../../public/logo', filename);
    }
}

const ICONS = {
    light: getIconPath('Icon-macOS-Default-1024x1024@1x.png'),
    dark: getIconPath('Icon-macOS-Dark-1024x1024@1x.png'),
};

function updateDockIcon(theme?: 'light' | 'dark' | 'system') {
    if (process.platform !== 'darwin') return;

    const currentSettings = getSettings();
    const mode = theme || currentSettings.theme || 'system';

    let useDark = false;
    if (mode === 'system') {
        useDark = nativeTheme.shouldUseDarkColors;
    } else {
        useDark = mode === 'dark';
    }

    const iconPath = useDark ? ICONS.dark : ICONS.light;
    try {
        app.dock.setIcon(iconPath);
    } catch (error) {
        console.warn('Failed to set dock icon:', error);
    }
}

// Update icon on theme change (system)
nativeTheme.on('updated', () => {
    const settings = getSettings();
    if (settings.theme === 'system') {
        updateDockIcon('system');
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
    if (settings.theme) {
        updateDockIcon(settings.theme);
    }
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
ipcMain.handle('import-files', async (_event, filePaths: string[], forceType?: 'music' | 'sfx') => {
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

            // Use forceType if provided, otherwise auto-detect
            const originalFilename = path.basename(sourcePath);
            const fileType = forceType || detectFileType(originalFilename);

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
                favorite: 0,
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
ipcMain.handle('list-files', (_event, type?: 'music' | 'sfx' | 'favorites') => {
    if (type === 'favorites') {
        return getFavorites();
    }
    if (type === 'music' || type === 'sfx') {
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

// File picker for importing (+ button)
ipcMain.handle('choose-files', async () => {
    if (!mainWindow) return [];

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        title: 'Select Audio Files',
        filters: [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'aiff', 'aif', 'flac', 'ogg', 'm4a', 'wma'] }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return [];
    }

    return result.filePaths;
});

// Delete specific files
ipcMain.handle('delete-files', async (_event, fileIds: string[]) => {
    const { removeFileFromLibrary } = await import('../native/storage');

    let deleted = 0;
    for (const id of fileIds) {
        const file = getFileById(id);
        if (file) {
            await removeFileFromLibrary(file.path);
            if (deleteFile(id)) {
                deleted++;
            }
        }
    }
    return { deleted };
});

// Delete cloud files
ipcMain.handle('delete-cloud-files', async (_event, storagePaths: string[]) => {
    const { deleteCloudFile, isSupabaseConfigured } = await import('../native/supabase');

    if (!(await isSupabaseConfigured())) {
        throw new Error('Supabase not configured');
    }

    let deleted = 0;
    for (const path of storagePaths) {
        const success = await deleteCloudFile(path);
        if (success) deleted++;
    }

    return { deleted };
});

// Update file (for favorites, tags, etc.)
ipcMain.handle('update-file', (_event, id: string, updates: { favorite?: number; tags?: string }) => {
    return updateFile(id, updates);
});

// Get file counts (for sidebar - always returns totals)
ipcMain.handle('get-file-counts', () => {
    const all = getAllFiles();
    return {
        all: all.length,
        music: all.filter(f => f.type === 'music').length,
        sfx: all.filter(f => f.type === 'sfx').length,
        favorites: all.filter(f => f.favorite === 1).length,
    };
});

// Native drag and drop
ipcMain.handle('start-drag', async (event, filePath: string) => {
    const icon = await app.getFileIcon(filePath);
    event.sender.startDrag({
        file: filePath,
        icon: icon,
    });
});

// Supabase upload file
ipcMain.handle('upload-file', async (_event, fileId: string) => {
    const { uploadFile, isSupabaseConfigured } = await import('../native/supabase');

    // Check if configured
    if (!(await isSupabaseConfigured())) {
        throw new Error('Supabase not configured. Please add URL and key in Settings.');
    }

    // Get file from database
    const file = getFileById(fileId);
    if (!file) {
        throw new Error('File not found in database');
    }

    // Upload to Supabase
    const result = await uploadFile(file.path, file.type, file.id);
    if (!result) {
        throw new Error('Upload returned no result');
    }

    // Update local database with cloud URL
    updateFile(fileId, {
        cloud_url: result.url,
        cloud_id: result.path,
    } as any);

    return { success: true, url: result.url };
});

// Check Supabase configuration
ipcMain.handle('is-supabase-configured', async () => {
    const { isSupabaseConfigured } = await import('../native/supabase');
    return await isSupabaseConfigured();
});

// Get unsynced files count
ipcMain.handle('get-unsynced-count', () => {
    const all = getAllFiles();
    return all.filter(f => !f.cloud_url).length;
});

// Sync worker state
let syncIntervalId: NodeJS.Timeout | null = null;

// Start auto-sync worker
ipcMain.handle('start-sync-worker', async () => {
    if (syncIntervalId) return { status: 'already-running' };

    const { isSupabaseConfigured, uploadFile } = await import('../native/supabase');

    if (!(await isSupabaseConfigured())) {
        return { status: 'not-configured' };
    }

    // Sync every 5 minutes
    syncIntervalId = setInterval(async () => {
        try {
            const unsyncedFiles = getAllFiles().filter(f => !f.cloud_url);

            for (const file of unsyncedFiles) {
                try {
                    const result = await uploadFile(file.path, file.type, file.id);
                    if (result) {
                        updateFile(file.id, {
                            cloud_url: result.url,
                            cloud_id: result.path,
                        } as any);
                    }
                } catch (err) {
                    console.error(`Sync failed for ${file.filename}:`, err);
                }
            }

            // Update last sync time
            setSettings({ lastSyncAt: new Date().toISOString() });

            // Notify renderer
            if (mainWindow) {
                mainWindow.webContents.send('sync-complete', {
                    synced: unsyncedFiles.length,
                    time: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Sync worker error:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes

    return { status: 'started' };
});

// Stop auto-sync worker
ipcMain.handle('stop-sync-worker', () => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        return { status: 'stopped' };
    }
    return { status: 'not-running' };
});

// Manual sync trigger
ipcMain.handle('trigger-sync', async () => {
    const { isSupabaseConfigured, uploadFile } = await import('../native/supabase');

    if (!(await isSupabaseConfigured())) {
        throw new Error('Supabase not configured');
    }

    const unsyncedFiles = getAllFiles().filter(f => !f.cloud_url);
    let synced = 0;

    for (const file of unsyncedFiles) {
        try {
            const result = await uploadFile(file.path, file.type, file.id);
            if (result) {
                updateFile(file.id, {
                    cloud_url: result.url,
                    cloud_id: result.path,
                } as any);
                synced++;
            }
        } catch (err) {
            console.error(`Sync failed for ${file.filename}:`, err);
        }
    }

    setSettings({ lastSyncAt: new Date().toISOString() });

    return { synced, total: unsyncedFiles.length, time: new Date().toISOString() };
});

// List cloud files
ipcMain.handle('list-cloud-files', async (_event, type?: 'music' | 'sfx') => {
    const { listCloudFiles } = await import('../native/supabase');
    return await listCloudFiles(type);
});

// Download a file from cloud
ipcMain.handle('download-cloud-file', async (_event, storagePath: string, fileType: 'music' | 'sfx') => {
    const { downloadFile, isSupabaseConfigured } = await import('../native/supabase');

    if (!(await isSupabaseConfigured())) {
        throw new Error('Supabase not configured');
    }

    const result = await downloadFile(storagePath, fileType);
    if (!result) {
        throw new Error('Download failed');
    }

    // Calculate metadata
    const { getAudioMetadata } = await import('../native/storage');
    const metadata = await getAudioMetadata(result.localPath);

    // Insert into local database
    insertFile({
        filename: result.filename,
        type: fileType,
        path: result.localPath,
        hash: metadata.hash,
        duration: metadata.duration,
        size: metadata.size,
        tags: '[]',
        bpm: null,
        favorite: 0,
        cloud_url: storagePath,
        cloud_id: storagePath, // Use full storage path as identifier
    });

    return { success: true, filename: result.filename };
});

// Get sync status - compare local vs cloud
ipcMain.handle('get-sync-status', async () => {
    const { listCloudFiles, isSupabaseConfigured } = await import('../native/supabase');

    if (!(await isSupabaseConfigured())) {
        return { uploadNeeded: 0, downloadNeeded: 0, configured: false };
    }

    // Get local files
    const localFiles = getAllFiles();
    const localCloudIds = new Set(localFiles.filter(f => f.cloud_id).map(f => f.cloud_id));

    // Get cloud files
    const cloudFiles = await listCloudFiles();

    // Files that need upload (local but not in cloud)
    const uploadNeeded = localFiles.filter(f => !f.cloud_url).length;

    // Files that need download (in cloud but not local)
    // Check by storagePath since we use that as cloud_id now
    const downloadNeeded = cloudFiles.filter(cf => !localCloudIds.has(cf.storagePath)).length;

    return { uploadNeeded, downloadNeeded, configured: true };
});

// Full bi-directional sync
ipcMain.handle('full-sync', async () => {
    const { uploadFile, downloadFile, listCloudFiles, isSupabaseConfigured } = await import('../native/supabase');
    const { getAudioMetadata } = await import('../native/storage');

    if (!(await isSupabaseConfigured())) {
        throw new Error('Supabase not configured');
    }

    let uploaded = 0;
    let downloaded = 0;

    // 1. Upload local files that aren't in cloud
    const unsyncedLocal = getAllFiles().filter(f => !f.cloud_url);
    for (const file of unsyncedLocal) {
        try {
            const result = await uploadFile(file.path, file.type, file.id);
            if (result) {
                updateFile(file.id, { cloud_url: result.url, cloud_id: result.path } as any);
                uploaded++;
            }
        } catch (err) {
            console.error(`Upload failed for ${file.filename}:`, err);
        }
    }

    // 2. Download cloud files that aren't local
    const cloudFiles = await listCloudFiles();
    const localCloudIds = new Set(getAllFiles().filter(f => f.cloud_id).map(f => f.cloud_id));

    for (const cf of cloudFiles) {
        if (localCloudIds.has(cf.storagePath)) {
            continue; // Already have this file
        }

        try {
            const result = await downloadFile(cf.storagePath, cf.type);
            if (result) {
                const metadata = await getAudioMetadata(result.localPath);
                insertFile({
                    filename: result.filename,
                    type: cf.type,
                    path: result.localPath,
                    hash: metadata.hash,
                    duration: metadata.duration,
                    size: metadata.size,
                    tags: '[]',
                    bpm: null,
                    favorite: 0,
                    cloud_url: cf.storagePath,
                    cloud_id: cf.storagePath, // Use full storage path as identifier
                });
                downloaded++;
            }
        } catch (err) {
            console.error(`Download failed for ${cf.name}:`, err);
        }
    }

    setSettings({ lastSyncAt: new Date().toISOString() });

    return { uploaded, downloaded, time: new Date().toISOString() };
});

// ============================================
// Sync Queue Handlers
// ============================================

// Get sync queue statistics
ipcMain.handle('get-sync-queue-stats', () => {
    return getQueueStats();
});

// Process sync queue (called periodically or when coming online)
ipcMain.handle('process-sync-queue', async () => {
    const { uploadFile, downloadFile, deleteCloudFile, isSupabaseConfigured } = await import('../native/supabase');

    if (!(await isSupabaseConfigured())) {
        return { processed: 0, failed: 0, message: 'Supabase not configured' };
    }

    const pendingItems = getPendingItems(10);
    let processed = 0;
    let failed = 0;

    for (const item of pendingItems) {
        markProcessing(item.id);

        try {
            switch (item.operation) {
                case 'upload': {
                    const file = getFileById(item.file_id);
                    if (!file) {
                        markFailed(item.id, 'File not found in database');
                        failed++;
                        continue;
                    }

                    const result = await uploadFile(file.path, file.type, file.id);
                    if (result) {
                        updateFile(file.id, { cloud_url: result.url, cloud_id: result.path } as any);
                        markCompleted(item.id);
                        processed++;
                    } else {
                        markFailed(item.id, 'Upload returned no result');
                        failed++;
                    }
                    break;
                }

                case 'download': {
                    if (!item.storage_path) {
                        markFailed(item.id, 'No storage path provided');
                        failed++;
                        continue;
                    }

                    const result = await downloadFile(item.storage_path, item.file_type);
                    if (result) {
                        const { getAudioMetadata } = await import('../native/storage');
                        const metadata = await getAudioMetadata(result.localPath);

                        insertFile({
                            filename: result.filename,
                            type: item.file_type,
                            path: result.localPath,
                            hash: metadata.hash,
                            duration: metadata.duration,
                            size: metadata.size,
                            tags: '[]',
                            bpm: null,
                            favorite: 0,
                            cloud_url: item.storage_path,
                            cloud_id: item.storage_path,
                        });

                        markCompleted(item.id);
                        processed++;
                    } else {
                        markFailed(item.id, 'Download returned no result');
                        failed++;
                    }
                    break;
                }

                case 'delete': {
                    if (!item.storage_path) {
                        markFailed(item.id, 'No storage path provided');
                        failed++;
                        continue;
                    }

                    const success = await deleteCloudFile(item.storage_path);
                    if (success) {
                        markCompleted(item.id);
                        processed++;
                    } else {
                        markFailed(item.id, 'Delete failed');
                        failed++;
                    }
                    break;
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            markFailed(item.id, errorMsg);
            failed++;
        }
    }

    return { processed, failed };
});

// Queue an upload operation (for offline use)
ipcMain.handle('queue-upload', (_event, fileId: string, fileType: 'music' | 'sfx') => {
    if (!isQueued(fileId, 'upload')) {
        return queueSyncOperation('upload', fileId, fileType);
    }
    return { message: 'Already queued' };
});

// Queue a download operation (for offline use)
ipcMain.handle('queue-download', (_event, storagePath: string, fileType: 'music' | 'sfx') => {
    if (!isQueued(storagePath, 'download')) {
        return queueSyncOperation('download', storagePath, fileType, storagePath);
    }
    return { message: 'Already queued' };
});

// Export mainWindow for menu access
export { mainWindow };
