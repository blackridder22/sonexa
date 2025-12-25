/**
 * File System Watcher
 * Watches the library folder for external file changes (e.g., files added via Finder)
 */

import path from 'path';
import { BrowserWindow } from 'electron';
import { getSetting } from '../electron/settings';
import { isAudioFile, detectFileType, getAudioMetadata } from './storage';
import { insertFile, getFileByHash } from './db';

// Use any type since chokidar is dynamically imported
let watcher: any = null;

/**
 * Get the resolved library path
 */
function getLibraryPath(): string {
    let libraryPath = getSetting('localLibraryPath');

    // Expand ~ to home directory
    if (libraryPath.startsWith('~')) {
        libraryPath = path.join(process.env.HOME || '', libraryPath.slice(1));
    }

    return libraryPath;
}

/**
 * Start watching the library folder for new files
 */
export async function startWatcher(mainWindow: BrowserWindow | null): Promise<void> {
    if (watcher) {
        console.log('[Watcher] Already running');
        return;
    }

    // Dynamic import for ESM-only chokidar
    const chokidar = await import('chokidar');

    const libraryPath = getLibraryPath();
    console.log('[Watcher] Starting to watch:', libraryPath);

    watcher = chokidar.watch(libraryPath, {
        ignored: /(^|[\/\\])\../, // Ignore dotfiles
        persistent: true,
        ignoreInitial: true, // Don't trigger on existing files
        awaitWriteFinish: {
            stabilityThreshold: 1000, // Wait for file to finish writing
            pollInterval: 100,
        },
    });

    // Handle new files
    watcher.on('add', async (filePath: string) => {
        console.log('[Watcher] File added:', filePath);

        // Check if it's an audio file
        if (!isAudioFile(filePath)) {
            console.log('[Watcher] Not an audio file, skipping:', filePath);
            return;
        }

        try {
            // Get metadata and check for duplicates
            const metadata = await getAudioMetadata(filePath);

            // Check if already in database (by hash)
            const existing = getFileByHash(metadata.hash);
            if (existing) {
                console.log('[Watcher] File already in database (duplicate hash):', filePath);
                return;
            }

            // Determine file type from path
            const filename = path.basename(filePath);
            const parentDir = path.basename(path.dirname(filePath));
            const fileType: 'music' | 'sfx' = parentDir === 'sfx' ? 'sfx' :
                parentDir === 'music' ? 'music' :
                    detectFileType(filename);

            // Insert into database
            const record = insertFile({
                filename,
                type: fileType,
                path: filePath,
                hash: metadata.hash,
                duration: metadata.duration,
                size: metadata.size,
                tags: '[]',
                bpm: null,
                favorite: 0,
                cloud_url: null,
                cloud_id: null,
            });

            console.log('[Watcher] Added file to database:', record.filename);

            // Notify renderer to refresh
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('library-updated', {
                    type: 'add',
                    file: record
                });
            }
        } catch (error) {
            console.error('[Watcher] Failed to process file:', filePath, error);
        }
    });

    // Handle deleted files
    watcher.on('unlink', (filePath: string) => {
        console.log('[Watcher] File removed:', filePath);

        // Notify renderer (it can handle cleanup if needed)
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('library-updated', {
                type: 'remove',
                path: filePath
            });
        }
    });

    watcher.on('error', (error: Error) => {
        console.error('[Watcher] Error:', error);
    });

    watcher.on('ready', () => {
        console.log('[Watcher] Ready and watching for changes');
    });
}

/**
 * Stop the file watcher
 */
export async function stopWatcher(): Promise<void> {
    if (watcher) {
        await watcher.close();
        watcher = null;
        console.log('[Watcher] Stopped');
    }
}

/**
 * Restart the watcher (e.g., when library path changes)
 */
export async function restartWatcher(mainWindow: BrowserWindow | null): Promise<void> {
    await stopWatcher();
    await startWatcher(mainWindow);
}
