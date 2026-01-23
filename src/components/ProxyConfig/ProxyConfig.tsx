import React, { useState, useEffect } from 'react';

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

interface Props {
  status: ProxyStatus;
  config: ProxyConfig;
  loading: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onUpdateConfig: (config: Partial<ProxyConfig>) => Promise<ProxyConfig>;
  onClearError: () => void;
}

function countValidProxies(text: string | undefined): number {
  if (!text) return 0;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  return lines.filter(line => {
    const parts = line.split(':');
    return parts.length >= 2;
  }).length;
}

export function ProxyConfig({
  status,
  config,
  loading,
  error,
  onStart,
  onStop,
  onRestart,
  onUpdateConfig,
  onClearError
}: Props) {
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleChange = (field: keyof ProxyConfig, value: string | number | boolean) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onUpdateConfig(localConfig);
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  const proxyCount = countValidProxies(localConfig.proxyList);

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Proxy Configuration</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${status.running ? 'bg-green-500' : 'bg-gray-500'}`}
          />
          <span className="text-sm text-gray-400">
            {status.running ? `Running (${status.proxies.filter(p => p.running).length}/${status.proxies.length})` : 'Stopped'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex justify-between items-center">
          <span className="text-red-300 text-sm">{error}</span>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-300 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Proxy List Input */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-300">Proxy List</h3>
          <span className="text-sm text-gray-500">{proxyCount} proxy(s)</span>
        </div>

        <div>
          <textarea
            className="input font-mono text-sm h-48 resize-y"
            placeholder={`Enter proxies, one per line:\nusername:password:hostname:port\n\nExamples:\nuser1:pass1:sg-pr.lunaproxy.net:23501\nuser2:pass2:us-pr.lunaproxy.net:23502\n\nOr without auth:\nhostname:port`}
            value={localConfig.proxyList || ''}
            onChange={(e) => handleChange('proxyList', e.target.value)}
            disabled={status.running}
            spellCheck={false}
          />
          <p className="text-xs text-gray-500 mt-2">
            Format: <code className="bg-gray-800 px-1 rounded">username:password:host:port</code> or <code className="bg-gray-800 px-1 rounded">host:port</code>
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Start Port</label>
          <input
            type="number"
            className="input"
            value={localConfig.startPort}
            onChange={(e) => handleChange('startPort', parseInt(e.target.value) || 8080)}
            disabled={status.running}
            min={1024}
            max={65535}
          />
          <p className="text-xs text-gray-500 mt-1">
            Local ports: {localConfig.startPort} - {localConfig.startPort + Math.max(0, proxyCount - 1)}
          </p>
        </div>

        <div>
          <label className="label">Default Action</label>
          <select
            className="input"
            value={localConfig.defaultAction}
            onChange={(e) => handleChange('defaultAction', e.target.value as 'proxy' | 'direct')}
          >
            <option value="proxy">Use Proxy (default)</option>
            <option value="direct">Direct Connection (default)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            When no rule matches
          </p>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              checked={localConfig.autoStart}
              onChange={(e) => handleChange('autoStart', e.target.checked)}
            />
            <span className="text-gray-300 text-sm">Auto-start on launch</span>
          </label>
        </div>
      </div>

      {hasChanges && (
        <div className="flex gap-2 pt-2 border-t border-gray-700">
          <button onClick={handleSave} className="btn btn-primary">
            Save Changes
          </button>
          <button onClick={handleDiscard} className="btn btn-secondary">
            Discard
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
        {!status.running ? (
          <button
            onClick={onStart}
            disabled={loading || proxyCount === 0}
            className="btn btn-success"
          >
            {loading ? 'Starting...' : `Start ${proxyCount} Proxy(s)`}
          </button>
        ) : (
          <>
            <button
              onClick={onStop}
              disabled={loading}
              className="btn btn-danger"
            >
              {loading ? 'Stopping...' : 'Stop All'}
            </button>
            <button
              onClick={onRestart}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? 'Restarting...' : 'Restart All'}
            </button>
          </>
        )}
      </div>

      {/* Active Proxies */}
      {status.running && status.proxies.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-gray-300">Active Proxies</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-700">
                  <th className="pb-2 pr-4">Local Port</th>
                  <th className="pb-2 pr-4">Upstream</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {status.proxies.map((proxy) => (
                  <tr key={proxy.id}>
                    <td className="py-2 pr-4">
                      <span className="font-mono text-blue-400">{proxy.localPort}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-400">
                      {proxy.host}:{proxy.port}
                      {proxy.username && <span className="text-gray-600 ml-1">({proxy.username})</span>}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center gap-1 ${proxy.running ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${proxy.running ? 'bg-green-500' : 'bg-red-500'}`} />
                        {proxy.running ? 'Running' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-2">
                      {status.localIps[0] && (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                            {status.localIps[0]}:{proxy.localPort}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(`${status.localIps[0]}:${proxy.localPort}`)}
                            className="text-xs text-gray-500 hover:text-gray-300"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Configure your devices to use these addresses as HTTP proxy.
            Make sure Windows Firewall allows incoming connections.
          </p>
        </div>
      )}

      {/* Local IPs */}
      {status.localIps.length > 0 && !status.running && (
        <div className="text-sm text-gray-500">
          Your LAN IP: {status.localIps.map(ip => (
            <code key={ip} className="bg-gray-800 px-2 py-1 rounded ml-1">{ip}</code>
          ))}
        </div>
      )}
    </div>
  );
}
