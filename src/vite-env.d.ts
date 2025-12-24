/// <reference types="vite/client" />

// File type enum
type FileType = 'music' | 'sfx' | 'favorites';

// File record interface
interface FileRecord {
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

// File counts interface
interface FileCounts {
    all: number;
    music: number;
    sfx: number;
    favorites: number;
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
        chooseFiles: () => Promise<string[]>;

        // File operations
        listFiles: (type?: FileType) => Promise<FileRecord[]>;
        importFiles: (paths: string[], forceType?: 'music' | 'sfx') => Promise<ImportResult>;
        deleteFiles: (fileIds: string[]) => Promise<{ deleted: number }>;
        deleteCloudFiles: (storagePaths: string[]) => Promise<{ deleted: number }>;
        updateFile: (id: string, updates: { favorite?: number; tags?: string }) => Promise<boolean>;
        getFileCounts: () => Promise<FileCounts>;

        // Cache management
        deleteCache: () => Promise<{ filesDeleted: number; recordsDeleted: number }>;

        // Native drag
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

interface CloudFile {
    name: string;
    id: string;
    storagePath: string;
    type: 'music' | 'sfx';
    size: number;
    updated_at: string;
}
