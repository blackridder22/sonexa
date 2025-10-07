import keytar from 'keytar';

let store;

async function getStore() {
  if (!store) {
    const {default: Store} = await import('electron-store');
    store = new Store();
  }
  return store;
}

const SERVICE_NAME = 'Sonexa';
const ACCOUNT_NAME = 'supabase_key';

export async function getSettings() {
  const store = await getStore();
  return {
    localLibraryPath: store.get('localLibraryPath', ''),
    autoSync: store.get('autoSync', false),
    supabaseUrl: store.get('supabaseUrl', ''),
  };
}

export async function setSettings(settings: any) {
  const store = await getStore();
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
