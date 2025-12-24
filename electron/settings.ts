import Store from 'electron-store';

export interface AppSettings {
    localLibraryPath: string;
    supabaseUrl: string;
    autoSync: boolean;
    lastSyncAt: string | null;
}

const defaults: AppSettings = {
    localLibraryPath: '~/SonexaLibrary',
    supabaseUrl: '',
    autoSync: false,
    lastSyncAt: null,
};

const store = new Store<AppSettings>({
    name: 'sonexa-settings',
    defaults,
});

export function getSettings(): AppSettings {
    return {
        localLibraryPath: store.get('localLibraryPath'),
        supabaseUrl: store.get('supabaseUrl'),
        autoSync: store.get('autoSync'),
        lastSyncAt: store.get('lastSyncAt'),
    };
}

export function setSettings(settings: Partial<AppSettings>): void {
    if (settings.localLibraryPath !== undefined) {
        store.set('localLibraryPath', settings.localLibraryPath);
    }
    if (settings.supabaseUrl !== undefined) {
        store.set('supabaseUrl', settings.supabaseUrl);
    }
    if (settings.autoSync !== undefined) {
        store.set('autoSync', settings.autoSync);
    }
    if (settings.lastSyncAt !== undefined) {
        store.set('lastSyncAt', settings.lastSyncAt);
    }
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return store.get(key);
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    store.set(key, value);
}

export function resetSettings(): void {
    store.clear();
}

export { store };
