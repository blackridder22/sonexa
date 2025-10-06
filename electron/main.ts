const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createMenu } = require('./menu');
const { getSettings, setSettings, getSupabaseKey, setSupabaseKey } = require('./settings');
const { initDatabase, insertFile, listFiles, updateFileCloudUrl } = require('../native/db');
const { importFiles } = require('../native/storage');
const { uploadFile } = require('../native/supabase');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Required for local file access
    }
  });

  createMenu(mainWindow);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-settings', async () => {
  return getSettings();
});

ipcMain.handle('set-settings', async (event, settings) => {
  setSettings(settings);
});

ipcMain.handle('get-supabase-key', async () => {
  return getSupabaseKey();
});

ipcMain.handle('set-supabase-key', async (event, key) => {
  await setSupabaseKey(key);
});

ipcMain.handle('import-files', async (event, filePaths) => {
  const settings = getSettings();
  const importedFiles = await importFiles(filePaths, settings.localLibraryPath);
  for (const file of importedFiles) {
    insertFile(file);
  }
  return importedFiles;
});

ipcMain.handle('list-files', async () => {
  return listFiles();
});

ipcMain.handle('start-drag', async (event, filePath) => {
  const iconPath = path.join(app.getAppPath(), 'assets', 'icon.png');
  event.sender.startDrag({
    file: filePath,
    icon: iconPath
  });
});

ipcMain.handle('upload-file', async (event, file) => {
  const settings = getSettings();
  const supabaseKey = await getSupabaseKey();
  if (!settings.supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key not configured.');
  }
  const result = await uploadFile(settings.supabaseUrl, supabaseKey, file);
  updateFileCloudUrl(file.id, result.publicUrl, result.path);
  return result;
});