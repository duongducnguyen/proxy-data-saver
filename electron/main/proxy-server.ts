import { networkInterfaces } from 'os';
import { EventEmitter } from 'events';
import { ruleEngine } from './rule-engine';
import { SNIProxyServer, TrafficLogData } from './sni-proxy-server';
import { ProxyStatus, TrafficLog, ProxyConfig, ProxyEntry, Rule, parseProxyList, buildUpstreamUrl } from './types';

interface ServerInstance {
  server: SNIProxyServer;
  entry: ProxyEntry;
}

export class ProxyServerManager extends EventEmitter {
  private servers: Map<number, ServerInstance> = new Map();
  private proxies: ProxyEntry[] = [];
  private isRunning: boolean = false;
  private trafficLogs: TrafficLog[] = [];
  private maxLogs: number = 1000;

  constructor() {
    super();
  }

  getLocalIps(): string[] {
    const interfaces = networkInterfaces();
    const ips: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;

      for (const info of iface) {
        if (info.family === 'IPv4' && !info.internal) {
          ips.push(info.address);
        }
      }
    }

    return ips;
  }

  async start(config: ProxyConfig, rules: Rule[]): Promise<ProxyStatus> {
    if (this.isRunning) {
      await this.stop();
    }

    ruleEngine.setDefaultAction(config.defaultAction);
    ruleEngine.loadRules(rules);

    this.proxies = parseProxyList(config.proxyList, config.startPort);

    if (this.proxies.length === 0) {
      throw new Error('No valid proxies found. Please enter at least one proxy.');
    }

    const startPromises = this.proxies.map(async (entry) => {
      try {
        const upstreamUrl = buildUpstreamUrl(entry);

        const server = new SNIProxyServer({
          port: entry.localPort,
          host: '0.0.0.0',
          upstreamProxyUrl: upstreamUrl,
          onRequest: ({ hostname, sniHostname, method }) => {
            // Use SNI hostname for rule matching if available
            const effectiveHostname = sniHostname || hostname;
            const { action, matchedRule } = ruleEngine.match(effectiveHostname);
            return { action, matchedRule: matchedRule?.name || null };
          }
        });

        server.on('traffic', (data: TrafficLogData) => {
          const log: TrafficLog = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            hostname: data.hostname,
            resolvedHostname: data.sniHostname, // Now this is SNI hostname
            method: data.method,
            url: `${data.hostname}:${data.port}`,
            action: data.action,
            matchedRule: data.matchedRule,
            localPort: entry.localPort
          };

          this.addTrafficLog(log);
          this.emit('traffic', log);
        });

        server.on('error', (error: Error) => {
          this.emit('error', { localPort: entry.localPort, error: error.message });
        });

        await server.start();
        entry.running = true;
        this.servers.set(entry.localPort, { server, entry });

        return { success: true, entry };
      } catch (err) {
        entry.running = false;
        return { success: false, entry, error: err };
      }
    });

    const results = await Promise.all(startPromises);

    const successCount = results.filter(r => r.success).length;
    if (successCount === 0) {
      throw new Error('Failed to start any proxy server');
    }

    this.isRunning = true;
    const status = this.getStatus();
    this.emit('started', status);

    return status;
  }

  async stop(): Promise<void> {
    const stopPromises = Array.from(this.servers.values()).map(async ({ server, entry }) => {
      try {
        await server.stop();
        entry.running = false;
      } catch (err) {
        console.error(`Failed to stop server on port ${entry.localPort}:`, err);
      }
    });

    await Promise.all(stopPromises);

    this.servers.clear();
    this.proxies.forEach(p => p.running = false);
    this.isRunning = false;
    this.emit('stopped');
  }

  async restart(config: ProxyConfig, rules: Rule[]): Promise<ProxyStatus> {
    await this.stop();
    return await this.start(config, rules);
  }

  getStatus(): ProxyStatus {
    return {
      running: this.isRunning,
      proxies: this.proxies.map(p => ({ ...p })),
      localIps: this.getLocalIps()
    };
  }

  updateRules(rules: Rule[]): void {
    ruleEngine.loadRules(rules);
  }

  updateDefaultAction(action: 'proxy' | 'direct'): void {
    ruleEngine.setDefaultAction(action);
  }

  private addTrafficLog(log: TrafficLog): void {
    this.trafficLogs.unshift(log);
    if (this.trafficLogs.length > this.maxLogs) {
      this.trafficLogs = this.trafficLogs.slice(0, this.maxLogs);
    }
  }

  getTrafficLogs(limit: number = 100): TrafficLog[] {
    return this.trafficLogs.slice(0, limit);
  }

  clearTrafficLogs(): void {
    this.trafficLogs = [];
    this.emit('traffic-cleared');
  }

  testRule(pattern: string, hostname: string): boolean {
    return ruleEngine.testRule(pattern, hostname);
  }

  validatePattern(pattern: string): { valid: boolean; error?: string } {
    return ruleEngine.validatePattern(pattern);
  }
}

export const proxyServer = new ProxyServerManager();
