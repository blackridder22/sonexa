import { Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron';

export function createApplicationMenu(mainWindow: BrowserWindow | null) {
    const isMac = process.platform === 'darwin';

    const template: MenuItemConstructorOptions[] = [
        // App menu (macOS only)
        ...(isMac
            ? [
                {
                    label: 'Sonexa',
                    submenu: [
                        { role: 'about' as const },
                        { type: 'separator' as const },
                        {
                            label: 'Settings',
                            accelerator: 'Cmd+,',
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send('open-settings');
                                }
                            },
                        },
                        { type: 'separator' as const },
                        { role: 'services' as const },
                        { type: 'separator' as const },
                        { role: 'hide' as const },
                        { role: 'hideOthers' as const },
                        { role: 'unhide' as const },
                        { type: 'separator' as const },
                        { role: 'quit' as const },
                    ],
                },
            ]
            : []),

        // File menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'Import Files...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('import-files-dialog');
                        }
                    },
                },
                { type: 'separator' },
                ...(isMac ? [] : [{ role: 'quit' as const }]),
            ],
        },

        // Edit menu
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },

        // View menu
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },

        // Window menu
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac
                    ? [
                        { type: 'separator' as const },
                        { role: 'front' as const },
                        { type: 'separator' as const },
                        { role: 'window' as const },
                    ]
                    : [{ role: 'close' as const }]),
            ],
        },

        // Help menu
        {
            label: 'Help',
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        const { shell } = await import('electron');
                        await shell.openExternal('https://github.com/sonexa/sonexa');
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
