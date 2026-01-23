import React, { useState, useMemo } from 'react';

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
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Traffic Monitor</h2>
        <div className="flex gap-2">
          <button
            onClick={onTogglePause}
            className={`btn ${paused ? 'btn-success' : 'btn-secondary'}`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={onClear} className="btn btn-danger">
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Requests</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.proxy}</div>
          <div className="text-xs text-gray-500">Via Proxy</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.direct}</div>
          <div className="text-xs text-gray-500">Direct</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.uniqueHosts}</div>
          <div className="text-xs text-gray-500">Unique Hosts</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          className="input flex-1 min-w-[200px]"
          placeholder="Filter by hostname..."
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
              {f === 'all' ? 'All' : f === 'proxy' ? 'Proxy' : 'Direct'}
            </button>
          ))}
        </div>
      </div>

      {paused && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-center text-yellow-300">
          Traffic monitoring is paused. Click Resume to continue.
        </div>
      )}

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">SNI / Hostname</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {logs.length === 0
                      ? 'No traffic yet. Start the proxy and make some requests.'
                      : 'No matching traffic found.'}
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
                        {log.action === 'proxy' ? 'Proxy' : 'Direct'}
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
        {filteredLogs.length > 100 && (
          <div className="px-4 py-2 text-center text-gray-500 text-sm bg-gray-800/50">
            Showing 100 of {filteredLogs.length} entries
          </div>
        )}
      </div>
    </div>
  );
}
