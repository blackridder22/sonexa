/// <reference types="vite/client" />

// File type enum
type FileType = 'music' | 'sfx';

// File record interface
interface FileRecord {
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

// Settings interface
interface AppSettings {
    localLibraryPath: string;
    supabaseUrl: string;
    autoSync: boolean;
    lastSyncAt: string | null;
}

// Import result interface
interface ImportResult {
    success: FileRecord[];
    failed: string[];
    duplicates: string[];
}

interface Window {
    sonexa: {
        // App info
        getAppVersion: () => Promise<string>;

        // Settings events
        onOpenSettings: (callback: () => void) => () => void;
        onImportProgress: (callback: (progress: { current: number; total: number; filename: string }) => void) => () => void;

        // Settings (electron-store)
        getSettings: () => Promise<AppSettings>;
        setSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;

        // Secrets (keytar)
        getSecret: (key: string) => Promise<string | null>;
        setSecret: (key: string, value: string) => Promise<{ success: boolean }>;
        deleteSecret: (key: string) => Promise<boolean>;

        // File dialog
        chooseDirectory: () => Promise<string | null>;

        // File operations
        listFiles: (type?: FileType) => Promise<FileRecord[]>;
        importFiles: (paths: string[]) => Promise<ImportResult>;
        deleteCache: () => Promise<{ filesDeleted: number; recordsDeleted: number }>;

        // Native drag
        startDrag: (filePath: string, iconPath: string) => Promise<void>;
    };
}
