import Store from 'electron-store';
import { EventEmitter } from 'events';
import { TrafficLog, DailyStats, DomainStats, AggregatedStats } from './types';

interface ProxyStats {
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  domainMap: Map<string, { bytes: number; action: 'proxy' | 'direct' | 'mixed'; count: number }>;
}

interface SessionStats {
  // Global stats
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  domainMap: Map<string, { bytes: number; action: 'proxy' | 'direct' | 'mixed'; count: number }>;
  // Per-proxy stats (keyed by localPort)
  perProxy: Map<number, ProxyStats>;
}

// Per-proxy summary for delta updates
export interface ProxyStatsSummary {
  localPort: number;
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  savingsPercent: number;
}

// Delta update sent to renderer (lightweight)
export interface StatsDelta {
  deltaBytes: number;
  deltaProxyBytes: number;
  deltaDirectBytes: number;
  deltaRequests: number;
  // Current totals for "today" period (global)
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  savingsPercent: number;
  // Top 5 domains (lightweight update)
  topDomains: DomainStats[];
  // Per-proxy summaries
  proxyStats: ProxyStatsSummary[];
}

interface StatsStoreSchema {
  dailyStats: DailyStats[];
}

const MAX_DAILY_STATS = 90;
const MAX_TOP_DOMAINS = 20;
const BATCH_INTERVAL_MS = 2000;

export class StatsManager extends EventEmitter {
  private store: Store<StatsStoreSchema>;
  private sessionStats: SessionStats;
  private today: string;

  // Delta tracking for batched updates
  private pendingDelta = { bytes: 0, proxyBytes: 0, directBytes: 0, requests: 0 };
  private batchTimer: NodeJS.Timeout | null = null;
  private hasPendingChanges = false;

  constructor() {
    super();
    this.store = new Store<StatsStoreSchema>({
      name: 'proxy-data-saver-stats',
      defaults: {
        dailyStats: []
      }
    });
    this.today = this.getDateString(new Date());
    this.sessionStats = this.createEmptySessionStats();
    this.loadTodayStats();
    this.startBatchTimer();
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.hasPendingChanges) {
        this.pushDelta();
      }
    }, BATCH_INTERVAL_MS);
  }

  stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private pushDelta(): void {
    if (!this.hasPendingChanges) return;

    const totalBytes = this.sessionStats.totalBytes;
    const savingsPercent = totalBytes > 0
      ? Math.round((this.sessionStats.directBytes / totalBytes) * 100)
      : 0;

    // Build per-proxy summaries
    const proxyStats: ProxyStatsSummary[] = [];
    for (const [localPort, stats] of this.sessionStats.perProxy) {
      const proxySavings = stats.totalBytes > 0
        ? Math.round((stats.directBytes / stats.totalBytes) * 100)
        : 0;
      proxyStats.push({
        localPort,
        totalBytes: stats.totalBytes,
        proxyBytes: stats.proxyBytes,
        directBytes: stats.directBytes,
        requestCount: stats.requestCount,
        savingsPercent: proxySavings
      });
    }

    const delta: StatsDelta = {
      deltaBytes: this.pendingDelta.bytes,
      deltaProxyBytes: this.pendingDelta.proxyBytes,
      deltaDirectBytes: this.pendingDelta.directBytes,
      deltaRequests: this.pendingDelta.requests,
      totalBytes: this.sessionStats.totalBytes,
      proxyBytes: this.sessionStats.proxyBytes,
      directBytes: this.sessionStats.directBytes,
      requestCount: this.sessionStats.requestCount,
      savingsPercent,
      topDomains: this.getTopDomainsFromSession(5),
      proxyStats
    };

    // Reset pending delta
    this.pendingDelta = { bytes: 0, proxyBytes: 0, directBytes: 0, requests: 0 };
    this.hasPendingChanges = false;

    // Emit delta event
    this.emit('delta', delta);
  }

  private createEmptySessionStats(): SessionStats {
    return {
      totalBytes: 0,
      proxyBytes: 0,
      directBytes: 0,
      requestCount: 0,
      domainMap: new Map(),
      perProxy: new Map()
    };
  }

  private createEmptyProxyStats(): ProxyStats {
    return {
      totalBytes: 0,
      proxyBytes: 0,
      directBytes: 0,
      requestCount: 0,
      domainMap: new Map()
    };
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private loadTodayStats(): void {
    const dailyStats = this.store.get('dailyStats') || [];
    const todayStats = dailyStats.find(s => s.date === this.today);

    if (todayStats) {
      this.sessionStats.totalBytes = todayStats.totalBytes;
      this.sessionStats.proxyBytes = todayStats.proxyBytes;
      this.sessionStats.directBytes = todayStats.directBytes;
      this.sessionStats.requestCount = todayStats.requestCount;

      // Rebuild domain map from top domains
      for (const domain of todayStats.topDomains) {
        this.sessionStats.domainMap.set(domain.hostname, {
          bytes: domain.totalBytes,
          action: domain.action,
          count: domain.requestCount
        });
      }
      // Note: per-proxy stats are not persisted, they start fresh each session
    }
  }

  recordTraffic(log: TrafficLog): void {
    // Check if day changed
    const currentDate = this.getDateString(new Date());
    if (currentDate !== this.today) {
      this.flushToDisk();
      this.today = currentDate;
      this.sessionStats = this.createEmptySessionStats();
    }

    const totalBytes = log.bytesIn + log.bytesOut;

    // Update global session stats
    this.sessionStats.totalBytes += totalBytes;
    this.sessionStats.requestCount += 1;

    // Accumulate delta for batched push
    this.pendingDelta.bytes += totalBytes;
    this.pendingDelta.requests += 1;
    this.hasPendingChanges = true;

    if (log.action === 'proxy') {
      this.sessionStats.proxyBytes += totalBytes;
      this.pendingDelta.proxyBytes += totalBytes;
    } else {
      this.sessionStats.directBytes += totalBytes;
      this.pendingDelta.directBytes += totalBytes;
    }

    // Update global domain stats
    const hostname = log.resolvedHostname || log.hostname;
    this.updateDomainStats(this.sessionStats.domainMap, hostname, totalBytes, log.action);

    // Update per-proxy stats
    let proxyStats = this.sessionStats.perProxy.get(log.localPort);
    if (!proxyStats) {
      proxyStats = this.createEmptyProxyStats();
      this.sessionStats.perProxy.set(log.localPort, proxyStats);
    }

    proxyStats.totalBytes += totalBytes;
    proxyStats.requestCount += 1;
    if (log.action === 'proxy') {
      proxyStats.proxyBytes += totalBytes;
    } else {
      proxyStats.directBytes += totalBytes;
    }
    this.updateDomainStats(proxyStats.domainMap, hostname, totalBytes, log.action);

    // Periodically flush to disk (every 10 requests)
    if (this.sessionStats.requestCount % 10 === 0) {
      this.flushToDisk();
    }
  }

  private updateDomainStats(
    domainMap: Map<string, { bytes: number; action: 'proxy' | 'direct' | 'mixed'; count: number }>,
    hostname: string,
    bytes: number,
    action: 'proxy' | 'direct'
  ): void {
    const existing = domainMap.get(hostname);
    if (existing) {
      existing.bytes += bytes;
      existing.count += 1;
      if (existing.action !== action) {
        existing.action = 'mixed';
      }
    } else {
      domainMap.set(hostname, { bytes, action, count: 1 });
    }
  }

  flushToDisk(): void {
    const dailyStats = this.store.get('dailyStats') || [];
    const todayIndex = dailyStats.findIndex(s => s.date === this.today);

    const topDomains = this.getTopDomainsFromSession(MAX_TOP_DOMAINS);

    const todayData: DailyStats = {
      date: this.today,
      totalBytes: this.sessionStats.totalBytes,
      proxyBytes: this.sessionStats.proxyBytes,
      directBytes: this.sessionStats.directBytes,
      requestCount: this.sessionStats.requestCount,
      topDomains
    };

    if (todayIndex >= 0) {
      dailyStats[todayIndex] = todayData;
    } else {
      dailyStats.push(todayData);
    }

    // Keep only last MAX_DAILY_STATS days
    dailyStats.sort((a, b) => b.date.localeCompare(a.date));
    const trimmed = dailyStats.slice(0, MAX_DAILY_STATS);

    this.store.set('dailyStats', trimmed);
  }

  private getTopDomainsFromSession(limit: number, localPort?: number): DomainStats[] {
    const domainMap = localPort
      ? this.sessionStats.perProxy.get(localPort)?.domainMap
      : this.sessionStats.domainMap;

    if (!domainMap) return [];

    const domains: DomainStats[] = [];
    for (const [hostname, stats] of domainMap) {
      domains.push({
        hostname,
        totalBytes: stats.bytes,
        action: stats.action,
        requestCount: stats.count
      });
    }

    return domains
      .sort((a, b) => b.totalBytes - a.totalBytes)
      .slice(0, limit);
  }

  getStats(period: 'today' | 'week' | 'month' | 'all', localPort?: number): AggregatedStats {
    // For "today" with proxy filter, use session stats
    if (period === 'today' && localPort !== undefined) {
      const proxyStats = this.sessionStats.perProxy.get(localPort);
      if (!proxyStats) {
        return {
          period,
          totalBytes: 0,
          proxyBytes: 0,
          directBytes: 0,
          savingsPercent: 0,
          requestCount: 0,
          topDomains: [],
          dailyBreakdown: []
        };
      }

      const savingsPercent = proxyStats.totalBytes > 0
        ? Math.round((proxyStats.directBytes / proxyStats.totalBytes) * 100)
        : 0;

      return {
        period,
        totalBytes: proxyStats.totalBytes,
        proxyBytes: proxyStats.proxyBytes,
        directBytes: proxyStats.directBytes,
        savingsPercent,
        requestCount: proxyStats.requestCount,
        topDomains: this.getTopDomainsFromSession(MAX_TOP_DOMAINS, localPort),
        dailyBreakdown: []
      };
    }

    // For historical data, use stored stats (no per-proxy breakdown in storage)
    this.flushToDisk();

    const dailyStats = this.store.get('dailyStats') || [];
    const now = new Date();

    let filteredStats: DailyStats[];

    switch (period) {
      case 'today':
        filteredStats = dailyStats.filter(s => s.date === this.today);
        break;
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = this.getDateString(weekAgo);
        filteredStats = dailyStats.filter(s => s.date >= weekAgoStr);
        break;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = this.getDateString(monthAgo);
        filteredStats = dailyStats.filter(s => s.date >= monthAgoStr);
        break;
      }
      case 'all':
      default:
        filteredStats = dailyStats;
        break;
    }

    // Aggregate stats
    let totalBytes = 0;
    let proxyBytes = 0;
    let directBytes = 0;
    let requestCount = 0;
    const domainMap = new Map<string, { bytes: number; action: 'proxy' | 'direct' | 'mixed'; count: number }>();

    for (const day of filteredStats) {
      totalBytes += day.totalBytes;
      proxyBytes += day.proxyBytes;
      directBytes += day.directBytes;
      requestCount += day.requestCount;

      for (const domain of day.topDomains) {
        const existing = domainMap.get(domain.hostname);
        if (existing) {
          existing.bytes += domain.totalBytes;
          existing.count += domain.requestCount;
          if (existing.action !== domain.action) {
            existing.action = 'mixed';
          }
        } else {
          domainMap.set(domain.hostname, {
            bytes: domain.totalBytes,
            action: domain.action,
            count: domain.requestCount
          });
        }
      }
    }

    // Calculate top domains
    const topDomains: DomainStats[] = [];
    for (const [hostname, stats] of domainMap) {
      topDomains.push({
        hostname,
        totalBytes: stats.bytes,
        action: stats.action,
        requestCount: stats.count
      });
    }
    topDomains.sort((a, b) => b.totalBytes - a.totalBytes);

    // Calculate savings percent
    const savingsPercent = totalBytes > 0 ? Math.round((directBytes / totalBytes) * 100) : 0;

    return {
      period,
      totalBytes,
      proxyBytes,
      directBytes,
      savingsPercent,
      requestCount,
      topDomains: topDomains.slice(0, MAX_TOP_DOMAINS),
      dailyBreakdown: filteredStats.sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  getTopDomains(period: 'today' | 'week' | 'month' | 'all', limit: number = 10, localPort?: number): DomainStats[] {
    const stats = this.getStats(period, localPort);
    return stats.topDomains.slice(0, limit);
  }

  // Get list of active proxy ports
  getActiveProxyPorts(): number[] {
    return Array.from(this.sessionStats.perProxy.keys()).sort((a, b) => a - b);
  }

  resetStats(): void {
    this.store.set('dailyStats', []);
    this.sessionStats = this.createEmptySessionStats();
    this.pendingDelta = { bytes: 0, proxyBytes: 0, directBytes: 0, requests: 0 };
    this.hasPendingChanges = false;
    this.emit('reset');
  }

  flush(): void {
    this.pushDelta();
    this.flushToDisk();
  }

  getSessionStats(): { totalBytes: number; proxyBytes: number; directBytes: number; requestCount: number } {
    return {
      totalBytes: this.sessionStats.totalBytes,
      proxyBytes: this.sessionStats.proxyBytes,
      directBytes: this.sessionStats.directBytes,
      requestCount: this.sessionStats.requestCount
    };
  }
}

export const statsManager = new StatsManager();
