import { contextBridge, ipcRenderer } from 'electron';

// File type enum
export type FileType = 'music' | 'sfx' | 'favorites';

// File record interface (matches native/db.ts)
export interface FileRecord {
    id: string;
    filename: string;
    type: 'music' | 'sfx';
    path: string;
    hash: string;
    duration: number;
    size: number;
    tags: string;
    bpm: number | null;
    favorite: number;
    created_at: string;
    updated_at: string;
    cloud_url: string | null;
    cloud_id: string | null;
}

// Settings interface matching electron-store schema
export interface AppSettings {
    localLibraryPath: string;
    supabaseUrl: string;
    autoSync: boolean;
    lastSyncAt: string | null;
}

// Import result interface
export interface ImportResult {
    success: FileRecord[];
    failed: string[];
    duplicates: string[];
}

// File counts interface
export interface FileCounts {
    all: number;
    music: number;
    sfx: number;
    favorites: number;
}

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('sonexa', {
    // App info
    getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

    // Settings events
    onOpenSettings: (callback: () => void) => {
        ipcRenderer.on('open-settings', callback);
        return () => ipcRenderer.removeListener('open-settings', callback);
    },

    // Import progress events
    onImportProgress: (callback: (progress: { current: number; total: number; filename: string }) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, progress: { current: number; total: number; filename: string }) => callback(progress);
        ipcRenderer.on('import-progress', handler);
        return () => ipcRenderer.removeListener('import-progress', handler);
    },

    // Settings (electron-store)
    getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
    setSettings: (settings: Partial<AppSettings>): Promise<{ success: boolean }> =>
        ipcRenderer.invoke('set-settings', settings),

    // Secrets (keytar - stored in OS keychain)
    getSecret: (key: string): Promise<string | null> => ipcRenderer.invoke('get-secret', key),
    setSecret: (key: string, value: string): Promise<{ success: boolean }> =>
        ipcRenderer.invoke('set-secret', key, value),
    deleteSecret: (key: string): Promise<boolean> => ipcRenderer.invoke('delete-secret', key),

    // File dialog
    chooseDirectory: (): Promise<string | null> => ipcRenderer.invoke('choose-directory'),
    chooseFiles: (): Promise<string[]> => ipcRenderer.invoke('choose-files'),

    // File operations
    listFiles: (type?: FileType): Promise<FileRecord[]> => ipcRenderer.invoke('list-files', type),
    importFiles: (paths: string[], forceType?: 'music' | 'sfx'): Promise<ImportResult> => ipcRenderer.invoke('import-files', paths, forceType),
    deleteFiles: (fileIds: string[]): Promise<{ deleted: number }> => ipcRenderer.invoke('delete-files', fileIds),
    deleteCloudFiles: (storagePaths: string[]): Promise<{ deleted: number }> => ipcRenderer.invoke('delete-cloud-files', storagePaths),
    updateFile: (id: string, updates: { favorite?: number; tags?: string }): Promise<boolean> => ipcRenderer.invoke('update-file', id, updates),
    getFileCounts: (): Promise<FileCounts> => ipcRenderer.invoke('get-file-counts'),

    // Cache management
    deleteCache: (): Promise<{ filesDeleted: number; recordsDeleted: number }> =>
        ipcRenderer.invoke('delete-cache'),

    // Native drag to external apps
    startDrag: (filePath: string): Promise<void> =>
        ipcRenderer.invoke('start-drag', filePath),

    // Supabase sync
    uploadFile: (fileId: string): Promise<{ success: boolean; url: string }> =>
        ipcRenderer.invoke('upload-file', fileId),
    isSupabaseConfigured: (): Promise<boolean> =>
        ipcRenderer.invoke('is-supabase-configured'),
    getUnsyncedCount: (): Promise<number> =>
        ipcRenderer.invoke('get-unsynced-count'),
    triggerSync: (): Promise<{ synced: number; total: number; time: string }> =>
        ipcRenderer.invoke('trigger-sync'),
    startSyncWorker: (): Promise<{ status: string }> =>
        ipcRenderer.invoke('start-sync-worker'),
    stopSyncWorker: (): Promise<{ status: string }> =>
        ipcRenderer.invoke('stop-sync-worker'),
    onSyncComplete: (callback: (data: { synced: number; time: string }) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, data: { synced: number; time: string }) => callback(data);
        ipcRenderer.on('sync-complete', handler);
        return () => ipcRenderer.removeListener('sync-complete', handler);
    },

    // Bi-directional sync
    listCloudFiles: (type?: 'music' | 'sfx'): Promise<CloudFile[]> =>
        ipcRenderer.invoke('list-cloud-files', type),
    downloadCloudFile: (storagePath: string, fileType: 'music' | 'sfx'): Promise<{ success: boolean; filename: string }> =>
        ipcRenderer.invoke('download-cloud-file', storagePath, fileType),
    getSyncStatus: (): Promise<{ uploadNeeded: number; downloadNeeded: number; configured: boolean }> =>
        ipcRenderer.invoke('get-sync-status'),
    fullSync: (): Promise<{ uploaded: number; downloaded: number; time: string }> =>
        ipcRenderer.invoke('full-sync'),
});

// Cloud file type
interface CloudFile {
    name: string;
    id: string;
    storagePath: string;
    type: 'music' | 'sfx';
    size: number;
    updated_at: string;
}

// TypeScript type declarations
declare global {
    interface Window {
        sonexa: {
            getAppVersion: () => Promise<string>;
            onOpenSettings: (callback: () => void) => () => void;
            onImportProgress: (callback: (progress: { current: number; total: number; filename: string }) => void) => () => void;
            getSettings: () => Promise<AppSettings>;
            setSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
            getSecret: (key: string) => Promise<string | null>;
            setSecret: (key: string, value: string) => Promise<{ success: boolean }>;
            deleteSecret: (key: string) => Promise<boolean>;
            chooseDirectory: () => Promise<string | null>;
            chooseFiles: () => Promise<string[]>;
            listFiles: (type?: FileType) => Promise<FileRecord[]>;
            importFiles: (paths: string[], forceType?: 'music' | 'sfx') => Promise<ImportResult>;
            deleteFiles: (fileIds: string[]) => Promise<{ deleted: number }>;
            deleteCloudFiles: (storagePaths: string[]) => Promise<{ deleted: number }>;
            updateFile: (id: string, updates: { favorite?: number; tags?: string }) => Promise<boolean>;
            getFileCounts: () => Promise<FileCounts>;
            deleteCache: () => Promise<{ filesDeleted: number; recordsDeleted: number }>;
            startDrag: (filePath: string) => Promise<void>;
            // Supabase sync
            uploadFile: (fileId: string) => Promise<{ success: boolean; url: string }>;
            isSupabaseConfigured: () => Promise<boolean>;
            getUnsyncedCount: () => Promise<number>;
            triggerSync: () => Promise<{ synced: number; total: number; time: string }>;
            startSyncWorker: () => Promise<{ status: string }>;
            stopSyncWorker: () => Promise<{ status: string }>;
            onSyncComplete: (callback: (data: { synced: number; time: string }) => void) => () => void;
            // Bi-directional sync
            listCloudFiles: (type?: 'music' | 'sfx') => Promise<CloudFile[]>;
            downloadCloudFile: (storagePath: string, fileType: 'music' | 'sfx') => Promise<{ success: boolean; filename: string }>;
            getSyncStatus: () => Promise<{ uploadNeeded: number; downloadNeeded: number; configured: boolean }>;
            fullSync: () => Promise<{ uploaded: number; downloaded: number; time: string }>;
        };
    }
}
