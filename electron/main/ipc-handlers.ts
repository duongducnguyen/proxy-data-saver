import { ipcMain, BrowserWindow } from 'electron';
import { proxyServer } from './proxy-server';
import { configStore } from './config-store';
import { Rule, ProxyConfig } from './types';
import { checkFirewallStatus, requestFirewallPermission } from './firewall-check';

let handlersRegistered = false;
let currentWindow: BrowserWindow | null = null;
const eventListeners: Array<{ event: string; listener: (...args: unknown[]) => void }> = [];

// Helper to safely send to renderer
function safeSend(channel: string, ...args: unknown[]): void {
  if (currentWindow && !currentWindow.isDestroyed()) {
    currentWindow.webContents.send(channel, ...args);
  }
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  currentWindow = mainWindow;

  // Only register handlers once
  if (handlersRegistered) {
    return;
  }
  handlersRegistered = true;
  // Proxy control
  ipcMain.handle('proxy:start', async () => {
    const config = configStore.getProxyConfig();
    const rules = configStore.getRules();
    return await proxyServer.start(config, rules);
  });

  ipcMain.handle('proxy:stop', async () => {
    await proxyServer.stop();
    return proxyServer.getStatus();
  });

  ipcMain.handle('proxy:restart', async () => {
    const config = configStore.getProxyConfig();
    const rules = configStore.getRules();
    return await proxyServer.restart(config, rules);
  });

  ipcMain.handle('proxy:status', () => {
    return proxyServer.getStatus();
  });

  // Config management
  ipcMain.handle('config:get', () => {
    return configStore.getFullConfig();
  });

  ipcMain.handle('config:setProxy', (_event, config: Partial<ProxyConfig>) => {
    const updated = configStore.setProxyConfig(config);
    if (proxyServer.getStatus().running) {
      proxyServer.updateDefaultAction(updated.defaultAction);
    }
    return updated;
  });

  ipcMain.handle('config:export', () => {
    return configStore.exportConfig();
  });

  ipcMain.handle('config:import', (_event, jsonString: string) => {
    return configStore.importConfig(jsonString);
  });

  ipcMain.handle('config:reset', () => {
    return configStore.resetToDefaults();
  });

  // Rules management
  ipcMain.handle('rules:get', () => {
    return configStore.getRules();
  });

  ipcMain.handle('rules:add', (_event, rule: Rule) => {
    const rules = configStore.addRule(rule);
    if (proxyServer.getStatus().running) {
      proxyServer.updateRules(rules);
    }
    return rules;
  });

  ipcMain.handle('rules:update', (_event, id: string, updates: Partial<Rule>) => {
    const rules = configStore.updateRule(id, updates);
    if (proxyServer.getStatus().running) {
      proxyServer.updateRules(rules);
    }
    return rules;
  });

  ipcMain.handle('rules:delete', (_event, id: string) => {
    const rules = configStore.deleteRule(id);
    if (proxyServer.getStatus().running) {
      proxyServer.updateRules(rules);
    }
    return rules;
  });

  ipcMain.handle('rules:setAll', (_event, rules: Rule[]) => {
    configStore.setRules(rules);
    if (proxyServer.getStatus().running) {
      proxyServer.updateRules(rules);
    }
    return rules;
  });

  ipcMain.handle('rules:test', (_event, pattern: string, hostname: string) => {
    return proxyServer.testRule(pattern, hostname);
  });

  ipcMain.handle('rules:validate', (_event, pattern: string) => {
    return proxyServer.validatePattern(pattern);
  });

  // Traffic logs
  ipcMain.handle('traffic:get', (_event, limit?: number) => {
    return proxyServer.getTrafficLogs(limit);
  });

  ipcMain.handle('traffic:clear', () => {
    proxyServer.clearTrafficLogs();
    return [];
  });

  // Stats management
  ipcMain.handle('stats:get', (_event, period: 'today' | 'week' | 'month' | 'all', localPort?: number) => {
    return proxyServer.getStats(period, localPort);
  });

  ipcMain.handle('stats:getTopDomains', (_event, period: 'today' | 'week' | 'month' | 'all', limit: number = 10, localPort?: number) => {
    return proxyServer.getTopDomains(period, limit, localPort);
  });

  ipcMain.handle('stats:reset', () => {
    proxyServer.resetStats();
    return { success: true };
  });

  ipcMain.handle('stats:getSession', () => {
    return proxyServer.getSessionStats();
  });

  ipcMain.handle('stats:getActiveProxyPorts', () => {
    return proxyServer.getActiveProxyPorts();
  });

  // Firewall check
  ipcMain.handle('firewall:check', async () => {
    return await checkFirewallStatus();
  });

  ipcMain.handle('firewall:requestPermission', async () => {
    return await requestFirewallPermission();
  });

  // Forward events to renderer (with destroyed window check)
  const trafficListener = (log: unknown) => {
    safeSend('traffic:new', log);
  };
  const startedListener = (status: unknown) => safeSend('proxy:started', status);
  const stoppedListener = () => safeSend('proxy:stopped');
  const errorListener = (error: { message: string }) => safeSend('proxy:error', error.message);
  const statusChangeListener = (status: unknown) => safeSend('proxy:status-change', status);
  const statsResetListener = () => safeSend('stats:reset');
  const statsDeltaListener = (delta: unknown) => safeSend('stats:delta', delta);

  proxyServer.on('traffic', trafficListener);
  proxyServer.on('started', startedListener);
  proxyServer.on('stopped', stoppedListener);
  proxyServer.on('error', errorListener);
  proxyServer.on('status-change', statusChangeListener);
  proxyServer.on('stats-reset', statsResetListener);
  proxyServer.on('stats-delta', statsDeltaListener);

  // Track listeners for cleanup
  eventListeners.push(
    { event: 'traffic', listener: trafficListener },
    { event: 'started', listener: startedListener },
    { event: 'stopped', listener: stoppedListener },
    { event: 'error', listener: errorListener },
    { event: 'status-change', listener: statusChangeListener },
    { event: 'stats-reset', listener: statsResetListener },
    { event: 'stats-delta', listener: statsDeltaListener }
  );
}

// Update window reference when window is recreated
export function updateWindowReference(mainWindow: BrowserWindow): void {
  currentWindow = mainWindow;
}

// Cleanup function for app quit
export function cleanupIpcHandlers(): void {
  for (const { event, listener } of eventListeners) {
    proxyServer.removeListener(event, listener);
  }
  eventListeners.length = 0;
  currentWindow = null;
  handlersRegistered = false;
}
