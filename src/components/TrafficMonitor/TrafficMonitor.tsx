import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../i18n';

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

interface ProxyEntry {
  id: string;
  localPort: number;
  running: boolean;
}

interface Props {
  logs: TrafficLog[];
  paused: boolean;
  onClear: () => void;
  onTogglePause: () => void;
  stats: {
    total: number;
    proxy: number;
    direct: number;
    uniqueHosts: number;
  };
  proxies: ProxyEntry[];
}

export function TrafficMonitor({ logs, paused, onClear, onTogglePause, stats, proxies }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'proxy' | 'direct'>('all');
  const [search, setSearch] = useState('');
  const [proxyFilter, setProxyFilter] = useState<'all' | number>('all');

  useEffect(() => {
    if (proxyFilter !== 'all') {
      const portExists = proxies.some(p => p.localPort === proxyFilter);
      if (!portExists) {
        setProxyFilter('all');
      }
    }
  }, [proxies, proxyFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filter !== 'all' && log.action !== filter) return false;
      if (proxyFilter !== 'all' && log.localPort !== proxyFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const matchHostname = log.hostname.toLowerCase().includes(searchLower);
        const matchResolved = log.resolvedHostname?.toLowerCase().includes(searchLower);
        if (!matchHostname && !matchResolved) return false;
      }
      return true;
    });
  }, [logs, filter, proxyFilter, search]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('traffic.title')}</h2>
        <div className="flex gap-2">
          <button onClick={onTogglePause} className={`btn ${paused ? 'btn-primary' : 'btn-ghost'}`}>
            {paused ? t('traffic.resume') : t('traffic.pause')}
          </button>
          <button onClick={onClear} className="btn btn-ghost">
            {t('traffic.clear')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-3 mb-5">
        {[
          { label: t('traffic.stats.total'), value: stats.total },
          { label: t('traffic.stats.proxy'), value: stats.proxy },
          { label: t('traffic.stats.direct'), value: stats.direct, highlight: true },
          { label: t('traffic.stats.hosts'), value: stats.uniqueHosts }
        ].map((stat, i) => (
          <div key={i} className="bg-neutral-100 dark:bg-neutral-900/50 rounded-lg p-3 text-center">
            <div className={`text-xl font-semibold tabular-nums ${stat.highlight ? 'text-green-600 dark:text-success-text' : 'text-neutral-900 dark:text-neutral-100'}`}>
              {stat.value}
            </div>
            <div className="text-2xs text-neutral-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          className="input flex-1 min-w-[180px]"
          placeholder={t('traffic.filter.placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {proxies.length > 0 && (
          <select
            className="input min-w-[120px]"
            value={proxyFilter}
            onChange={(e) => setProxyFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          >
            <option value="all">{t('traffic.filter.allProxies')}</option>
            {proxies.map((p) => (
              <option key={p.localPort} value={p.localPort}>
                Port {p.localPort}
              </option>
            ))}
          </select>
        )}
        <div className="flex bg-neutral-200 dark:bg-neutral-900 rounded p-0.5 gap-0.5">
          {(['all', 'proxy', 'direct'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {f === 'all' ? t('traffic.filter.all') : f === 'proxy' ? t('traffic.filter.proxy') : t('traffic.filter.direct')}
            </button>
          ))}
        </div>
      </div>

      {/* Paused warning */}
      {paused && (
        <div className="flex-shrink-0 mb-4 bg-neutral-200 dark:bg-neutral-900 rounded-lg p-2 text-center text-xs text-neutral-500">
          {t('traffic.paused')}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-950">
              <tr className="text-left text-neutral-500 text-xs uppercase tracking-wider">
                <th className="pb-3 font-medium w-20">{t('traffic.table.time')}</th>
                <th className="pb-3 font-medium w-20">{t('traffic.table.method')}</th>
                <th className="pb-3 font-medium">{t('traffic.table.hostname')}</th>
                <th className="pb-3 font-medium w-16">{t('traffic.table.action')}</th>
                <th className="pb-3 font-medium w-32">{t('traffic.table.rule')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500 dark:text-neutral-600 text-sm">
                    {logs.length === 0 ? t('traffic.noTraffic') : t('traffic.noMatch')}
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 100).map((log) => (
                  <tr key={log.id} className="group">
                    <td className="py-2 text-neutral-500 font-mono text-xs">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="py-2">
                      <span className="text-2xs font-mono text-neutral-500">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-xs max-w-[280px]">
                      {log.resolvedHostname ? (
                        <div>
                          <div className="text-neutral-800 dark:text-neutral-200 truncate">{log.resolvedHostname}</div>
                          <div className="text-neutral-500 dark:text-neutral-600 text-2xs truncate">({log.hostname})</div>
                        </div>
                      ) : (
                        <span className="text-neutral-600 dark:text-neutral-400 truncate">{log.hostname}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <span className={`text-2xs font-medium ${
                        log.action === 'direct' ? 'text-green-600 dark:text-success-text' : 'text-neutral-500'
                      }`}>
                        {log.action === 'proxy' ? 'P' : 'D'}
                      </span>
                    </td>
                    <td className="py-2 text-neutral-500 dark:text-neutral-600 text-xs truncate max-w-[120px]">
                      {log.matchedRule || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      {filteredLogs.length > 100 && (
        <div className="flex-shrink-0 mt-2 text-center text-neutral-500 dark:text-neutral-600 text-xs">
          {t('traffic.showing').replace('{count}', '100').replace('{total}', String(filteredLogs.length))}
        </div>
      )}
    </div>
  );
}
