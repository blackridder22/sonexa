const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sonexa', {
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('set-settings', settings),
  getSupabaseKey: () => ipcRenderer.invoke('get-supabase-key'),
  setSupabaseKey: (key) => ipcRenderer.invoke('set-supabase-key', key),
  importFiles: (filePaths) => ipcRenderer.invoke('import-files', filePaths),
  listFiles: () => ipcRenderer.invoke('list-files'),
});
