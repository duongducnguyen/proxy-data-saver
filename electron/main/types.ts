export interface Rule {
  id: string;
  name: string;
  pattern: string;
  action: 'proxy' | 'direct';
  enabled: boolean;
  priority: number;
}

export interface ProxyEntry {
  id: string;
  username: string;
  password: string;
  host: string;
  port: number;
  localPort: number;
  running: boolean;
}

export interface ProxyConfig {
  startPort: number;
  defaultAction: 'proxy' | 'direct';
  autoStart: boolean;
  proxyList: string; // Raw text: user:pass:host:port per line
}

export interface TrafficLog {
  id: string;
  timestamp: number;
  hostname: string;
  resolvedHostname: string | null; // SNI hostname extracted from TLS ClientHello
  method: string;
  url: string;
  action: 'proxy' | 'direct';
  matchedRule: string | null;
  localPort: number;
  bytesIn: number;      // Bytes received from server
  bytesOut: number;     // Bytes sent to server
}

// Stats per domain
export interface DomainStats {
  hostname: string;
  totalBytes: number;
  action: 'proxy' | 'direct' | 'mixed';
  requestCount: number;
}

// Daily stats (stored in electron-store)
export interface DailyStats {
  date: string;          // "2026-01-26"
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  topDomains: DomainStats[];
}

// Aggregated stats for frontend
export interface AggregatedStats {
  period: 'today' | 'week' | 'month' | 'all';
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  savingsPercent: number;
  requestCount: number;
  topDomains: DomainStats[];
  dailyBreakdown: DailyStats[];
}

export interface ProxyStatus {
  running: boolean;
  proxies: ProxyEntry[];
  localIps: string[];
}

export interface AppConfig {
  proxyConfig: ProxyConfig;
  rules: Rule[];
}

export const DEFAULT_CONFIG: AppConfig = {
  proxyConfig: {
    startPort: 8080,
    defaultAction: 'proxy',
    autoStart: false,
    proxyList: ''
  },
  rules: [
    {
      id: 'default-direct-local',
      name: 'Local addresses',
      pattern: '*.local, localhost, 127.0.0.1',
      action: 'direct',
      enabled: true,
      priority: 10
    }
  ]
};

// Parse proxy list text to ProxyEntry array
export function parseProxyList(text: string, startPort: number): ProxyEntry[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const proxies: ProxyEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(':');

    if (parts.length >= 4) {
      // Format: username:password:host:port
      const [username, password, host, portStr] = parts;
      const port = parseInt(portStr, 10);

      if (host && !isNaN(port)) {
        proxies.push({
          id: `proxy-${i}`,
          username: username || '',
          password: password || '',
          host,
          port,
          localPort: startPort + i,
          running: false
        });
      }
    } else if (parts.length === 2) {
      // Format: host:port (no auth)
      const [host, portStr] = parts;
      const port = parseInt(portStr, 10);

      if (host && !isNaN(port)) {
        proxies.push({
          id: `proxy-${i}`,
          username: '',
          password: '',
          host,
          port,
          localPort: startPort + i,
          running: false
        });
      }
    }
  }

  return proxies;
}

// Build upstream URL from ProxyEntry
export function buildUpstreamUrl(entry: ProxyEntry): string {
  let url = 'http://';
  if (entry.username) {
    url += entry.username;
    if (entry.password) {
      url += `:${entry.password}`;
    }
    url += '@';
  }
  url += `${entry.host}:${entry.port}`;
  return url;
}
