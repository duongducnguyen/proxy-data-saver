import { app, BrowserWindow, shell, Tray, Menu, nativeImage } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { configStore } from './config-store';
import { proxyServer } from './proxy-server';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
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

  // Auto-start proxy if configured
  const config = configStore.getProxyConfig();
  if (config.autoStart && config.upstreamProxyUrl) {
    const rules = configStore.getRules();
    proxyServer.start(config, rules).catch((err) => {
      console.error('Failed to auto-start proxy:', err);
    });
  }

  mainWindow.on('close', () => {
    // Don't prevent close - let app quit and stop proxy
    isQuitting = true;
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
        mainWindow?.show();
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
      click: () => {
        proxyServer.stop().then(() => {
          app.quit();
        });
      }
    }
  ]);

  tray.setToolTip('Proxy Data Saver');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
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
  if (process.platform !== 'darwin') {
    isQuitting = true;
    proxyServer.stop().then(() => {
      app.quit();
    });
  }
});

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    await proxyServer.stop();
    app.quit();
  }
});
