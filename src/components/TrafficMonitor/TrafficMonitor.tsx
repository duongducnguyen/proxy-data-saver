import React, { useState, useMemo } from 'react';
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
}

export function TrafficMonitor({ logs, paused, onClear, onTogglePause, stats }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'proxy' | 'direct'>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filter !== 'all' && log.action !== filter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const matchHostname = log.hostname.toLowerCase().includes(searchLower);
        const matchResolved = log.resolvedHostname?.toLowerCase().includes(searchLower);
        if (!matchHostname && !matchResolved) return false;
      }
      return true;
    });
  }, [logs, filter, search]);

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
    <div className="h-full flex flex-col card">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">{t('traffic.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={onTogglePause}
            className={`btn ${paused ? 'btn-success' : 'btn-secondary'}`}
          >
            {paused ? t('traffic.resume') : t('traffic.pause')}
          </button>
          <button onClick={onClear} className="btn btn-danger">
            {t('traffic.clear')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-3 mt-4">
        <div className="bg-gray-900 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">{t('traffic.stats.total')}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.proxy}</div>
          <div className="text-xs text-gray-500">{t('traffic.stats.proxy')}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-green-400">{stats.direct}</div>
          <div className="text-xs text-gray-500">{t('traffic.stats.direct')}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-purple-400">{stats.uniqueHosts}</div>
          <div className="text-xs text-gray-500">{t('traffic.stats.hosts')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 flex flex-wrap gap-2 mt-4">
        <input
          type="text"
          className="input flex-1 min-w-[200px]"
          placeholder={t('traffic.filter.placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          {(['all', 'proxy', 'direct'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? t('traffic.filter.all') : f === 'proxy' ? t('traffic.filter.proxy') : t('traffic.filter.direct')}
            </button>
          ))}
        </div>
      </div>

      {/* Paused Warning */}
      {paused && (
        <div className="flex-shrink-0 mt-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-2 text-center text-yellow-300 text-sm">
          {t('traffic.paused')}
        </div>
      )}

      {/* Table - Scrollable */}
      <div className="flex-1 overflow-hidden mt-4 bg-gray-900 rounded-lg">
        <div className="h-full overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">{t('traffic.table.time')}</th>
                <th className="px-4 py-3 font-medium">{t('traffic.table.method')}</th>
                <th className="px-4 py-3 font-medium">{t('traffic.table.hostname')}</th>
                <th className="px-4 py-3 font-medium">{t('traffic.table.action')}</th>
                <th className="px-4 py-3 font-medium">{t('traffic.table.rule')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {logs.length === 0
                      ? t('traffic.noTraffic')
                      : t('traffic.noMatch')}
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 100).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 bg-gray-700 rounded text-xs font-mono">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs max-w-[300px]">
                      {log.resolvedHostname ? (
                        <div>
                          <div className="text-green-400 truncate" title={`SNI: ${log.resolvedHostname}`}>
                            {log.resolvedHostname}
                          </div>
                          <div className="text-gray-500 text-[10px] truncate" title={`CONNECT: ${log.hostname}`}>
                            ({log.hostname})
                          </div>
                        </div>
                      ) : (
                        <span className="text-yellow-400 truncate" title={`CONNECT: ${log.hostname} (no SNI)`}>
                          {log.hostname}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          log.action === 'proxy'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-green-900 text-green-300'
                        }`}
                      >
                        {log.action === 'proxy' ? t('traffic.filter.proxy') : t('traffic.filter.direct')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs truncate max-w-[150px]">
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
        <div className="flex-shrink-0 mt-2 text-center text-gray-500 text-xs">
          {t('traffic.showing').replace('{count}', '100').replace('{total}', String(filteredLogs.length))}
        </div>
      )}
    </div>
  );
}
