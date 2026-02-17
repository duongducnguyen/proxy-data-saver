import { networkInterfaces } from 'os';
import { EventEmitter } from 'events';
import { ruleEngine } from './rule-engine';
import { SNIProxyServer, TrafficLogData } from './sni-proxy-server';
import { ProxyStatus, TrafficLog, ProxyConfig, ProxyEntry, Rule, AggregatedStats, DomainStats, parseProxyList, buildUpstreamUrl } from './types';
import { statsManager, StatsDelta } from './stats-manager';

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

    // Forward stats delta events
    statsManager.on('delta', (delta: StatsDelta) => {
      this.emit('stats-delta', delta);
    });

    statsManager.on('reset', () => {
      this.emit('stats-reset');
    });
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

    // Track used ports to avoid duplicates
    const usedPorts = new Set<number>();
    const maxRetries = 100; // Max ports to try per proxy

    // Start proxies sequentially to properly handle port conflicts
    const results: { success: boolean; entry: ProxyEntry; error?: unknown }[] = [];

    for (const entry of this.proxies) {
      let currentPort = entry.localPort;
      let started = false;
      let lastError: unknown = null;

      // Find an available port by trying to start the server
      for (let retry = 0; retry < maxRetries && !started; retry++) {
        // Skip ports already used by other proxies in this session
        while (usedPorts.has(currentPort)) {
          currentPort++;
        }

        try {
          const upstreamUrl = buildUpstreamUrl(entry);

          const server = new SNIProxyServer({
            port: currentPort,
            host: '0.0.0.0',
            upstreamProxyUrl: upstreamUrl,
            onRequest: ({ hostname, sniHostname }) => {
              const effectiveHostname = sniHostname || hostname;
              const { action, matchedRule } = ruleEngine.match(effectiveHostname);
              return { action, matchedRule: matchedRule?.name || null };
            }
          });

          server.on('traffic', (data: TrafficLogData) => {
            const log: TrafficLog = {
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              timestamp: Date.now(),
              hostname: data.hostname,
              resolvedHostname: data.sniHostname,
              method: data.method,
              url: `${data.hostname}:${data.port}`,
              action: data.action,
              matchedRule: data.matchedRule,
              localPort: entry.localPort,
              bytesIn: data.bytesIn,
              bytesOut: data.bytesOut
            };

            this.addTrafficLog(log);
            statsManager.recordTraffic(log);
            this.emit('traffic', log);
          });

          server.on('error', (error: Error) => {
            this.emit('error', { localPort: entry.localPort, error: error.message });
          });

          await server.start();

          // Success! Update entry with actual port used
          entry.localPort = currentPort;
          entry.running = true;
          usedPorts.add(currentPort);
          this.servers.set(currentPort, { server, entry });
          started = true;
          results.push({ success: true, entry });

        } catch (err: unknown) {
          lastError = err;
          const errorMessage = err instanceof Error ? err.message : String(err);
          // If port is in use, try next port
          if (errorMessage.includes('EADDRINUSE') || errorMessage.includes('address already in use')) {
            console.log(`Port ${currentPort} in use, trying next...`);
            currentPort++;
          } else {
            // Other error, stop retrying
            break;
          }
        }
      }

      if (!started) {
        entry.running = false;
        results.push({ success: false, entry, error: lastError });
        console.error(`Failed to start proxy ${entry.host}:${entry.port} after ${maxRetries} retries`);
      }
    }

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

  // Stats methods
  getStats(period: 'today' | 'week' | 'month' | 'all', localPort?: number): AggregatedStats {
    return statsManager.getStats(period, localPort);
  }

  getTopDomains(period: 'today' | 'week' | 'month' | 'all', limit: number = 10, localPort?: number): DomainStats[] {
    return statsManager.getTopDomains(period, limit, localPort);
  }

  getActiveProxyPorts(): number[] {
    return statsManager.getActiveProxyPorts();
  }

  resetStats(): void {
    statsManager.resetStats();
    // 'stats-reset' event is emitted by statsManager and forwarded in constructor
  }

  getSessionStats(): { totalBytes: number; proxyBytes: number; directBytes: number; requestCount: number } {
    return statsManager.getSessionStats();
  }
}

export const proxyServer = new ProxyServerManager();
