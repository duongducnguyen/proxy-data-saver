import { useState, useEffect, useCallback, useRef } from 'react';

export type StatsPeriod = 'today' | 'week' | 'month' | 'all';

interface DomainStats {
  hostname: string;
  totalBytes: number;
  action: 'proxy' | 'direct' | 'mixed';
  requestCount: number;
}

interface DailyStats {
  date: string;
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  topDomains: DomainStats[];
}

interface AggregatedStats {
  period: StatsPeriod;
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  savingsPercent: number;
  requestCount: number;
  topDomains: DomainStats[];
  dailyBreakdown: DailyStats[];
}

interface ProxyStatsSummary {
  localPort: number;
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  savingsPercent: number;
}

// Delta from main process (batched every 2s)
interface StatsDelta {
  deltaBytes: number;
  deltaProxyBytes: number;
  deltaDirectBytes: number;
  deltaRequests: number;
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  requestCount: number;
  savingsPercent: number;
  topDomains: DomainStats[];
  proxyStats: ProxyStatsSummary[];
}

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export function useStats() {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>('today');
  const [selectedProxy, setSelectedProxy] = useState<number | undefined>(undefined); // undefined = all proxies
  const [proxyPorts, setProxyPorts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodRef = useRef(period);
  const selectedProxyRef = useRef(selectedProxy);

  // Keep refs in sync
  useEffect(() => {
    periodRef.current = period;
    selectedProxyRef.current = selectedProxy;
  }, [period, selectedProxy]);

  const fetchStats = useCallback(async (fetchPeriod: StatsPeriod, localPort?: number) => {
    if (!isElectron) return;

    try {
      const result = await window.electronAPI.stats.get(fetchPeriod, localPort);
      setStats(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(String(err));
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchStats(period, selectedProxy);
    setLoading(false);
  }, [period, selectedProxy, fetchStats]);

  const changePeriod = useCallback(async (newPeriod: StatsPeriod) => {
    setPeriod(newPeriod);
    setLoading(true);
    await fetchStats(newPeriod, selectedProxy);
    setLoading(false);
  }, [selectedProxy, fetchStats]);

  const changeProxy = useCallback(async (localPort: number | undefined) => {
    setSelectedProxy(localPort);
    setLoading(true);
    await fetchStats(period, localPort);
    setLoading(false);
  }, [period, fetchStats]);

  const resetStats = useCallback(async () => {
    if (!isElectron) return;

    try {
      await window.electronAPI.stats.reset();
      // Stats will be updated via delta/reset event
    } catch (err) {
      console.error('Failed to reset stats:', err);
      setError(String(err));
    }
  }, []);

  useEffect(() => {
    if (!isElectron) {
      console.warn('electronAPI not available - running outside Electron?');
      setLoading(false);
      return;
    }

    // Initial load
    fetchStats(period, selectedProxy).then(() => setLoading(false));

    // Subscribe to batched delta updates (every 2 seconds)
    const unsubDelta = window.electronAPI.stats.onDelta((delta: StatsDelta) => {
      // Update proxy ports list
      const ports = delta.proxyStats.map(p => p.localPort);
      setProxyPorts(prev => {
        const newPorts = [...new Set([...prev, ...ports])].sort((a, b) => a - b);
        return JSON.stringify(newPorts) !== JSON.stringify(prev) ? newPorts : prev;
      });

      // Only apply delta if we're viewing "today"
      if (periodRef.current === 'today') {
        const currentProxy = selectedProxyRef.current;

        if (currentProxy === undefined) {
          // Viewing all proxies - use global stats
          setStats(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              totalBytes: delta.totalBytes,
              proxyBytes: delta.proxyBytes,
              directBytes: delta.directBytes,
              requestCount: delta.requestCount,
              savingsPercent: delta.savingsPercent,
              topDomains: delta.topDomains
            };
          });
        } else {
          // Viewing specific proxy - find matching proxy stats
          const proxyData = delta.proxyStats.find(p => p.localPort === currentProxy);
          if (proxyData) {
            setStats(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                totalBytes: proxyData.totalBytes,
                proxyBytes: proxyData.proxyBytes,
                directBytes: proxyData.directBytes,
                requestCount: proxyData.requestCount,
                savingsPercent: proxyData.savingsPercent
                // Note: topDomains for specific proxy requires a fetch
              };
            });
          }
        }
      }
    });

    // Subscribe to stats reset
    const unsubReset = window.electronAPI.stats.onReset(() => {
      setStats(prev => prev ? {
        ...prev,
        totalBytes: 0,
        proxyBytes: 0,
        directBytes: 0,
        requestCount: 0,
        savingsPercent: 0,
        topDomains: [],
        dailyBreakdown: []
      } : null);
      setProxyPorts([]);
    });

    return () => {
      unsubDelta();
      unsubReset();
    };
  }, [period, selectedProxy, fetchStats]);

  return {
    stats,
    period,
    selectedProxy,
    proxyPorts,
    loading,
    error,
    changePeriod,
    changeProxy,
    resetStats,
    refresh
  };
}
