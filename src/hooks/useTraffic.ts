import { useState, useEffect, useCallback, useRef } from 'react';

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

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export function useTraffic(maxLogs: number = 200) {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!isElectron) return;

    const loadInitialLogs = async () => {
      try {
        const initialLogs = await window.electronAPI.traffic.get(maxLogs);
        setLogs(initialLogs);
      } catch (err) {
        console.error('Failed to load traffic logs:', err);
      }
    };

    loadInitialLogs();

    const unsubscribe = window.electronAPI.traffic.onNew((log) => {
      if (!pausedRef.current) {
        setLogs((prev) => {
          const newLogs = [log, ...prev];
          if (newLogs.length > maxLogs) {
            return newLogs.slice(0, maxLogs);
          }
          return newLogs;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [maxLogs]);

  const clear = useCallback(async () => {
    if (!isElectron) {
      setLogs([]);
      return;
    }
    try {
      await window.electronAPI.traffic.clear();
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear traffic logs:', err);
    }
  }, []);

  const togglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  const getStats = useCallback(() => {
    const proxyCount = logs.filter((l) => l.action === 'proxy').length;
    const directCount = logs.filter((l) => l.action === 'direct').length;
    // Use resolvedHostname if available for unique count
    const uniqueHosts = new Set(logs.map((l) => l.resolvedHostname || l.hostname)).size;

    return {
      total: logs.length,
      proxy: proxyCount,
      direct: directCount,
      uniqueHosts
    };
  }, [logs]);

  return {
    logs,
    paused,
    clear,
    togglePause,
    getStats
  };
}
