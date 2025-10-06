const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sonexa', {
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
});
