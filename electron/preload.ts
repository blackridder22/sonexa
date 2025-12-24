import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('sonexa', {
    // App info
    getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

    // Settings events
    onOpenSettings: (callback: () => void) => {
        ipcRenderer.on('open-settings', callback);
        return () => ipcRenderer.removeListener('open-settings', callback);
    },

    // Placeholder APIs for future tasks
    listFiles: (): Promise<unknown[]> => ipcRenderer.invoke('list-files'),
    importFiles: (paths: string[]): Promise<void> => ipcRenderer.invoke('import-files', paths),
    startDrag: (filePath: string, iconPath: string): Promise<void> =>
        ipcRenderer.invoke('start-drag', filePath, iconPath),

    // Settings
    getSettings: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('get-settings'),
    setSettings: (settings: Record<string, unknown>): Promise<void> =>
        ipcRenderer.invoke('set-settings', settings),

    // Secrets (keytar)
    getSecret: (key: string): Promise<string | null> => ipcRenderer.invoke('get-secret', key),
    setSecret: (key: string, value: string): Promise<void> =>
        ipcRenderer.invoke('set-secret', key, value),
});

// TypeScript type declarations
declare global {
    interface Window {
        sonexa: {
            getAppVersion: () => Promise<string>;
            onOpenSettings: (callback: () => void) => () => void;
            listFiles: () => Promise<unknown[]>;
            importFiles: (paths: string[]) => Promise<void>;
            startDrag: (filePath: string, iconPath: string) => Promise<void>;
            getSettings: () => Promise<Record<string, unknown>>;
            setSettings: (settings: Record<string, unknown>) => Promise<void>;
            getSecret: (key: string) => Promise<string | null>;
            setSecret: (key: string, value: string) => Promise<void>;
        };
    }
}
