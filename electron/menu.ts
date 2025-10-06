import { Menu, BrowserWindow } from 'electron';

export function createMenu(mainWindow: BrowserWindow) {
  const template = [
    {
      label: 'Sonexa',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('open-settings');
          }
        },
        { role: 'quit' }
      ]
    },
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}
