const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sonexa', {
  // We can expose specific ipcRenderer functions here if needed
});
