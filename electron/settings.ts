import Store from 'electron-store';
import keytar from 'keytar';

const store = new Store();

const SERVICE_NAME = 'Sonexa';
const ACCOUNT_NAME = 'supabase_key';

export function getSettings() {
  return {
    localLibraryPath: store.get('localLibraryPath', ''),
    autoSync: store.get('autoSync', false),
    supabaseUrl: store.get('supabaseUrl', ''),
  };
}

export function setSettings(settings: any) {
  store.set('localLibraryPath', settings.localLibraryPath);
  store.set('autoSync', settings.autoSync);
  store.set('supabaseUrl', settings.supabaseUrl);
}

export async function getSupabaseKey() {
  return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function setSupabaseKey(key: string) {
  return keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, key);
}
