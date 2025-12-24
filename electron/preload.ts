import { contextBridge, ipcRenderer } from 'electron';

// Settings interface matching electron-store schema
export interface AppSettings {
    localLibraryPath: string;
    supabaseUrl: string;
    autoSync: boolean;
    lastSyncAt: string | null;
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

    // Placeholder APIs for future tasks
    listFiles: (): Promise<unknown[]> => ipcRenderer.invoke('list-files'),
    importFiles: (paths: string[]): Promise<void> => ipcRenderer.invoke('import-files', paths),
    startDrag: (filePath: string, iconPath: string): Promise<void> =>
        ipcRenderer.invoke('start-drag', filePath, iconPath),
});

// TypeScript type declarations
declare global {
    interface Window {
        sonexa: {
            getAppVersion: () => Promise<string>;
            onOpenSettings: (callback: () => void) => () => void;
            getSettings: () => Promise<AppSettings>;
            setSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
            getSecret: (key: string) => Promise<string | null>;
            setSecret: (key: string, value: string) => Promise<{ success: boolean }>;
            deleteSecret: (key: string) => Promise<boolean>;
            chooseDirectory: () => Promise<string | null>;
            listFiles: () => Promise<unknown[]>;
            importFiles: (paths: string[]) => Promise<void>;
            startDrag: (filePath: string, iconPath: string) => Promise<void>;
        };
    }
}
