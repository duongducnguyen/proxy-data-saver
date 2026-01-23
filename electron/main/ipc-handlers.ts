import { ipcMain, BrowserWindow } from 'electron';
import { proxyServer } from './proxy-server';
import { configStore } from './config-store';
import { Rule, ProxyConfig } from './types';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
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

  // Forward events to renderer
  proxyServer.on('traffic', (log) => {
    mainWindow.webContents.send('traffic:new', log);
  });

  proxyServer.on('started', (status) => {
    mainWindow.webContents.send('proxy:started', status);
  });

  proxyServer.on('stopped', () => {
    mainWindow.webContents.send('proxy:stopped');
  });

  proxyServer.on('error', (error) => {
    mainWindow.webContents.send('proxy:error', error.message);
  });

  proxyServer.on('status-change', (status) => {
    mainWindow.webContents.send('proxy:status-change', status);
  });
}
