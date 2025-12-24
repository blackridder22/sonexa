import { contextBridge, ipcRenderer } from 'electron';

// File type enum
export type FileType = 'music' | 'sfx';

// File record interface (matches native/db.ts)
export interface FileRecord {
    id: string;
    filename: string;
    type: FileType;
    path: string;
    hash: string;
    duration: number;
    size: number;
    tags: string;
    bpm: number | null;
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

    // File operations
    listFiles: (type?: FileType): Promise<FileRecord[]> => ipcRenderer.invoke('list-files', type),
    importFiles: (paths: string[]): Promise<ImportResult> => ipcRenderer.invoke('import-files', paths),

    // Cache management
    deleteCache: (): Promise<{ filesDeleted: number; recordsDeleted: number }> =>
        ipcRenderer.invoke('delete-cache'),

    // Native drag (placeholder for T7)
    startDrag: (filePath: string, iconPath: string): Promise<void> =>
        ipcRenderer.invoke('start-drag', filePath, iconPath),
});

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
            listFiles: (type?: FileType) => Promise<FileRecord[]>;
            importFiles: (paths: string[]) => Promise<ImportResult>;
            deleteCache: () => Promise<{ filesDeleted: number; recordsDeleted: number }>;
            startDrag: (filePath: string, iconPath: string) => Promise<void>;
        };
    }
}
