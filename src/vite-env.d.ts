/// <reference types="vite/client" />

interface Rule {
  id: string;
  name: string;
  pattern: string;
  action: 'proxy' | 'direct';
  enabled: boolean;
  priority: number;
}

interface ProxyEntry {
  id: string;
  username: string;
  password: string;
  host: string;
  port: number;
  localPort: number;
  running: boolean;
}

interface ProxyConfig {
  startPort: number;
  defaultAction: 'proxy' | 'direct';
  autoStart: boolean;
  proxyList: string;
}

interface TrafficLog {
  id: string;
  timestamp: number;
  hostname: string;
  resolvedHostname: string | null;
  method: string;
  url: string;
  action: 'proxy' | 'direct';
  matchedRule: string | null;
  localPort: number;
}

interface ProxyStatus {
  running: boolean;
  proxies: ProxyEntry[];
  localIps: string[];
}

interface AppConfig {
  proxyConfig: ProxyConfig;
  rules: Rule[];
}

interface ElectronAPI {
  proxy: {
    start: () => Promise<ProxyStatus>;
    stop: () => Promise<ProxyStatus>;
    restart: () => Promise<ProxyStatus>;
    getStatus: () => Promise<ProxyStatus>;
    onStarted: (callback: (status: ProxyStatus) => void) => () => void;
    onStopped: (callback: () => void) => () => void;
    onError: (callback: (error: string) => void) => () => void;
    onStatusChange: (callback: (status: ProxyStatus) => void) => () => void;
  };
  config: {
    get: () => Promise<AppConfig>;
    setProxy: (config: Partial<ProxyConfig>) => Promise<ProxyConfig>;
    export: () => Promise<string>;
    import: (jsonString: string) => Promise<AppConfig>;
    reset: () => Promise<AppConfig>;
  };
  rules: {
    get: () => Promise<Rule[]>;
    add: (rule: Rule) => Promise<Rule[]>;
    update: (id: string, updates: Partial<Rule>) => Promise<Rule[]>;
    delete: (id: string) => Promise<Rule[]>;
    setAll: (rules: Rule[]) => Promise<Rule[]>;
    test: (pattern: string, hostname: string) => Promise<boolean>;
    validate: (pattern: string) => Promise<{ valid: boolean; error?: string }>;
  };
  traffic: {
    get: (limit?: number) => Promise<TrafficLog[]>;
    clear: () => Promise<TrafficLog[]>;
    onNew: (callback: (log: TrafficLog) => void) => () => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
