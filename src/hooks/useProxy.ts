import { useState, useEffect, useCallback } from 'react';

interface ProxyEntry {
  id: string;
  username: string;
  password: string;
  host: string;
  port: number;
  localPort: number;
  running: boolean;
}

interface ProxyStatus {
  running: boolean;
  proxies: ProxyEntry[];
  localIps: string[];
}

interface ProxyConfig {
  startPort: number;
  defaultAction: 'proxy' | 'direct';
  autoStart: boolean;
  proxyList: string;
}

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export function useProxy() {
  const [status, setStatus] = useState<ProxyStatus>({
    running: false,
    proxies: [],
    localIps: []
  });
  const [config, setConfig] = useState<ProxyConfig>({
    startPort: 8080,
    defaultAction: 'proxy',
    autoStart: false,
    proxyList: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isElectron) {
      console.warn('electronAPI not available - running outside Electron?');
      return;
    }

    const loadInitial = async () => {
      try {
        const [statusResult, configResult] = await Promise.all([
          window.electronAPI.proxy.getStatus(),
          window.electronAPI.config.get()
        ]);
        setStatus(statusResult);
        // Merge with defaults in case old config is missing new fields
        setConfig(prev => ({
          ...prev,
          ...configResult.proxyConfig,
          proxyList: configResult.proxyConfig.proxyList || ''
        }));
      } catch (err) {
        console.error('Failed to load initial config:', err);
        setError(String(err));
      }
    };

    loadInitial();

    const unsubStarted = window.electronAPI.proxy.onStarted((newStatus) => {
      setStatus(newStatus);
      setLoading(false);
    });

    const unsubStopped = window.electronAPI.proxy.onStopped(() => {
      setStatus((prev) => ({ ...prev, running: false, proxies: prev.proxies.map(p => ({ ...p, running: false })) }));
      setLoading(false);
    });

    const unsubError = window.electronAPI.proxy.onError((err) => {
      setError(err);
      setLoading(false);
    });

    const unsubStatusChange = window.electronAPI.proxy.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubStarted();
      unsubStopped();
      unsubError();
      unsubStatusChange();
    };
  }, []);

  const start = useCallback(async () => {
    if (!isElectron) return;
    setLoading(true);
    setError(null);
    try {
      const newStatus = await window.electronAPI.proxy.start();
      setStatus(newStatus);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (!isElectron) return;
    setLoading(true);
    setError(null);
    try {
      const newStatus = await window.electronAPI.proxy.stop();
      setStatus(newStatus);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const restart = useCallback(async () => {
    if (!isElectron) return;
    setLoading(true);
    setError(null);
    try {
      const newStatus = await window.electronAPI.proxy.restart();
      setStatus(newStatus);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<ProxyConfig>) => {
    if (!isElectron) return config;
    try {
      const newConfig = await window.electronAPI.config.setProxy(updates);
      setConfig(newConfig);
      return newConfig;
    } catch (err) {
      setError(String(err));
      throw err;
    }
  }, [config]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    status,
    config,
    loading,
    error,
    start,
    stop,
    restart,
    updateConfig,
    clearError
  };
}
