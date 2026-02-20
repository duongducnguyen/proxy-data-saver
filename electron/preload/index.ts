import { contextBridge, ipcRenderer } from 'electron';
import type { Rule, ProxyConfig, ProxyStatus, TrafficLog, AppConfig, ProxyEntry, AggregatedStats, DomainStats, DailyStats } from '../main/types';
import type { StatsDelta, ProxyStatsSummary } from '../main/stats-manager';

console.log('Preload script loading...');

export type { Rule, ProxyConfig, ProxyStatus, TrafficLog, AppConfig, ProxyEntry, AggregatedStats, DomainStats, DailyStats, StatsDelta, ProxyStatsSummary };

const electronAPI = {
  // Proxy control
  proxy: {
    start: (): Promise<ProxyStatus> => ipcRenderer.invoke('proxy:start'),
    stop: (): Promise<ProxyStatus> => ipcRenderer.invoke('proxy:stop'),
    restart: (): Promise<ProxyStatus> => ipcRenderer.invoke('proxy:restart'),
    getStatus: (): Promise<ProxyStatus> => ipcRenderer.invoke('proxy:status'),
    onStarted: (callback: (status: ProxyStatus) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: ProxyStatus) => callback(status);
      ipcRenderer.on('proxy:started', listener);
      return () => ipcRenderer.removeListener('proxy:started', listener);
    },
    onStopped: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('proxy:stopped', listener);
      return () => ipcRenderer.removeListener('proxy:stopped', listener);
    },
    onError: (callback: (error: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
      ipcRenderer.on('proxy:error', listener);
      return () => ipcRenderer.removeListener('proxy:error', listener);
    },
    onStatusChange: (callback: (status: ProxyStatus) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: ProxyStatus) => callback(status);
      ipcRenderer.on('proxy:status-change', listener);
      return () => ipcRenderer.removeListener('proxy:status-change', listener);
    }
  },

  // Config management
  config: {
    get: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
    setProxy: (config: Partial<ProxyConfig>): Promise<ProxyConfig> =>
      ipcRenderer.invoke('config:setProxy', config),
    export: (): Promise<string> => ipcRenderer.invoke('config:export'),
    import: (jsonString: string): Promise<AppConfig> =>
      ipcRenderer.invoke('config:import', jsonString),
    reset: (): Promise<AppConfig> => ipcRenderer.invoke('config:reset')
  },

  // Rules management
  rules: {
    get: (): Promise<Rule[]> => ipcRenderer.invoke('rules:get'),
    add: (rule: Rule): Promise<Rule[]> => ipcRenderer.invoke('rules:add', rule),
    update: (id: string, updates: Partial<Rule>): Promise<Rule[]> =>
      ipcRenderer.invoke('rules:update', id, updates),
    delete: (id: string): Promise<Rule[]> => ipcRenderer.invoke('rules:delete', id),
    setAll: (rules: Rule[]): Promise<Rule[]> => ipcRenderer.invoke('rules:setAll', rules),
    test: (pattern: string, hostname: string): Promise<boolean> =>
      ipcRenderer.invoke('rules:test', pattern, hostname),
    validate: (pattern: string): Promise<{ valid: boolean; error?: string }> =>
      ipcRenderer.invoke('rules:validate', pattern)
  },

  // Traffic logs
  traffic: {
    get: (limit?: number): Promise<TrafficLog[]> => ipcRenderer.invoke('traffic:get', limit),
    clear: (): Promise<TrafficLog[]> => ipcRenderer.invoke('traffic:clear'),
    onNew: (callback: (log: TrafficLog) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, log: TrafficLog) => callback(log);
      ipcRenderer.on('traffic:new', listener);
      return () => ipcRenderer.removeListener('traffic:new', listener);
    }
  },

  // Window control
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized);
      ipcRenderer.on('window:maximized', listener);
      return () => ipcRenderer.removeListener('window:maximized', listener);
    }
  },

  // Theme management
  theme: {
    setTheme: (theme: 'light' | 'dark'): void => ipcRenderer.send('theme:set', theme)
  },

  // Firewall check
  firewall: {
    check: (): Promise<{ allowed: boolean; checked: boolean; error?: string }> =>
      ipcRenderer.invoke('firewall:check'),
    requestPermission: (): Promise<boolean> =>
      ipcRenderer.invoke('firewall:requestPermission')
  },

  // Stats management
  stats: {
    get: (period: 'today' | 'week' | 'month' | 'all', localPort?: number): Promise<AggregatedStats> =>
      ipcRenderer.invoke('stats:get', period, localPort),
    getTopDomains: (period: 'today' | 'week' | 'month' | 'all', limit?: number, localPort?: number): Promise<DomainStats[]> =>
      ipcRenderer.invoke('stats:getTopDomains', period, limit, localPort),
    reset: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('stats:reset'),
    getSession: (): Promise<{ totalBytes: number; proxyBytes: number; directBytes: number; requestCount: number }> =>
      ipcRenderer.invoke('stats:getSession'),
    getActiveProxyPorts: (): Promise<number[]> =>
      ipcRenderer.invoke('stats:getActiveProxyPorts'),
    onReset: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('stats:reset', listener);
      return () => ipcRenderer.removeListener('stats:reset', listener);
    },
    onDelta: (callback: (delta: StatsDelta) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, delta: StatsDelta) => callback(delta);
      ipcRenderer.on('stats:delta', listener);
      return () => ipcRenderer.removeListener('stats:delta', listener);
    }
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script loaded successfully, electronAPI exposed');

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
