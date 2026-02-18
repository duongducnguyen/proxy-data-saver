import { app, BrowserWindow, shell, Tray, Menu, nativeImage, ipcMain } from 'electron';
import { join } from 'path';
import { registerIpcHandlers, updateWindowReference, cleanupIpcHandlers } from './ipc-handlers';
import { configStore } from './config-store';
import { proxyServer } from './proxy-server';
import { statsManager } from './stats-manager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let windowControlsRegistered = false;
let currentTheme: 'light' | 'dark' = 'dark';

function updateTrayIcon(theme: 'light' | 'dark'): void {
  if (!tray) return;

  // Use opposite color for visibility: light icon on dark system tray, dark icon on light
  // For dark app theme, Windows tray is usually dark, so use light icon
  // For light app theme, we still use light icon since Windows tray is typically dark
  const iconName = theme === 'dark' ? 'logo-light.png' : 'logo-dark.png';
  const iconPath = join(__dirname, '../../resources/', iconName);

  try {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      tray.setImage(icon);
    }
  } catch (err) {
    console.error('Failed to update tray icon:', err);
  }
}

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
    icon: join(__dirname, '../../resources/logo-dark.png'),
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

  // Register IPC handlers (only once, but update window reference)
  registerIpcHandlers(mainWindow);
  updateWindowReference(mainWindow);

  // Window control handlers (register only once)
  if (!windowControlsRegistered) {
    windowControlsRegistered = true;

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

    ipcMain.on('theme:set', (_event, theme: 'light' | 'dark') => {
      currentTheme = theme;
      updateTrayIcon(theme);
    });
  }

  // Send maximize state changes to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized', false);
  });

  // Auto-start proxy if configured
  const config = configStore.getProxyConfig();
  if (config.autoStart && config.proxyList) {
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

function updateTrayMenu(): void {
  if (!tray) return;

  const isRunning = proxyServer.getStatus().running;

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
      label: isRunning ? 'Stop Proxy' : 'Start Proxy',
      click: async () => {
        if (isRunning) {
          await proxyServer.stop();
        } else {
          try {
            const config = configStore.getProxyConfig();
            const rules = configStore.getRules();
            await proxyServer.start(config, rules);
          } catch (err) {
            console.error('Failed to start proxy:', err);
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: async () => {
        isQuitting = true;
        try {
          statsManager.stopBatchTimer();
          cleanupIpcHandlers();
          await proxyServer.stop();
        } catch (err) {
          console.error('Error during quit cleanup:', err);
        }
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray(): void {
  // Use light logo for tray (app is dark theme, Windows tray is usually dark)
  const iconPath = join(__dirname, '../../resources/logo-light.png');

  let icon: nativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Proxy Data Saver');

  // Set initial menu
  updateTrayMenu();

  // Update menu when proxy status changes
  proxyServer.on('started', updateTrayMenu);
  proxyServer.on('stopped', updateTrayMenu);

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
    try {
      // Stop batch timer first
      statsManager.stopBatchTimer();
      // Cleanup IPC handlers
      cleanupIpcHandlers();
      // Stop proxy server
      await proxyServer.stop();
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
    app.quit();
  }
});
