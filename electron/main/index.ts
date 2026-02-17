import { app, BrowserWindow, shell, Tray, Menu, nativeImage, ipcMain } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { configStore } from './config-store';
import { proxyServer } from './proxy-server';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow(): void {
  // 16:9 aspect ratio
  const width = 1024;
  const height = 576;

  mainWindow = new BrowserWindow({
    width,
    height,
    resizable: false,
    maximizable: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    icon: join(__dirname, '../../resources/icon.png'),
    show: false,
    backgroundColor: '#111827'
  });

  // Remove default menu
  Menu.setApplicationMenu(null);

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Development: load from vite dev server
  // Production: load from built files
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools in development
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  registerIpcHandlers(mainWindow);

  // Window control handlers
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Send maximize state changes to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized', false);
  });

  // Auto-start proxy if configured
  const config = configStore.getProxyConfig();
  if (config.autoStart && config.upstreamProxyUrl) {
    const rules = configStore.getRules();
    proxyServer.start(config, rules).catch((err) => {
      console.error('Failed to auto-start proxy:', err);
    });
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray(): void {
  const iconPath = join(__dirname, '../../resources/icon.png');

  // Create a simple tray icon
  let icon: nativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      // Create a simple 16x16 icon if file not found
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Start Proxy',
      click: async () => {
        try {
          const config = configStore.getProxyConfig();
          const rules = configStore.getRules();
          await proxyServer.start(config, rules);
        } catch (err) {
          console.error('Failed to start proxy:', err);
        }
      }
    },
    {
      label: 'Stop Proxy',
      click: async () => {
        await proxyServer.stop();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: async () => {
        isQuitting = true;
        await proxyServer.stop();
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Proxy Data Saver');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Single click also shows window (Windows behavior)
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit - app runs in tray
  // Only quit via tray menu "Quit" or when isQuitting is true
});

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    await proxyServer.stop();
    app.quit();
  }
});
