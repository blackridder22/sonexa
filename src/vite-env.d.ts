/// <reference types="vite/client" />

// Settings interface matching the electron-store schema
interface AppSettings {
    localLibraryPath: string;
    supabaseUrl: string;
    autoSync: boolean;
    lastSyncAt: string | null;
}

interface Window {
    sonexa: {
        // App info
        getAppVersion: () => Promise<string>;

        // Settings events
        onOpenSettings: (callback: () => void) => () => void;

        // Settings (electron-store)
        getSettings: () => Promise<AppSettings>;
        setSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;

        // Secrets (keytar - stored in OS keychain)
        getSecret: (key: string) => Promise<string | null>;
        setSecret: (key: string, value: string) => Promise<{ success: boolean }>;
        deleteSecret: (key: string) => Promise<boolean>;

        // File dialog
        chooseDirectory: () => Promise<string | null>;

        // File operations (future)
        listFiles: () => Promise<unknown[]>;
        importFiles: (paths: string[]) => Promise<void>;
        startDrag: (filePath: string, iconPath: string) => Promise<void>;
    };
}
