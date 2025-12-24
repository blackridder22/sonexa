/// <reference types="vite/client" />

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
