import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';

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
  const { t } = useTranslation();
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
  const runningCount = status.proxies.filter(p => p.running).length;

  // View: Active Proxies (when running)
  if (status.running) {
    return (
      <div className="h-full flex flex-col card">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{t('proxy.titleActive')}</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400">
              {runningCount}/{status.proxies.length} {t('proxy.status.running')}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex-shrink-0 mt-4 bg-red-900/50 border border-red-700 rounded-lg p-4 flex justify-between items-center">
            <span className="text-red-300 text-sm">{error}</span>
            <button
              onClick={onClearError}
              className="text-red-400 hover:text-red-300 ml-4"
            >
              {t('proxy.dismiss')}
            </button>
          </div>
        )}

        {/* Table - Scrollable */}
        <div className="flex-1 overflow-hidden mt-4">
          <div className="h-full overflow-y-auto bg-gray-900 rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">{t('proxy.table.localPort')}</th>
                  <th className="px-4 py-3 font-medium">{t('proxy.table.upstream')}</th>
                  <th className="px-4 py-3 font-medium">{t('proxy.table.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('proxy.table.lanAddress')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {status.proxies.map((proxy) => (
                  <tr key={proxy.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 text-lg">{proxy.localPort}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{proxy.host}:{proxy.port}</div>
                      {proxy.username && (
                        <div className="text-xs text-gray-500">{proxy.username}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                        proxy.running
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          proxy.running ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        {proxy.running ? t('proxy.status.ok') : t('proxy.status.failed')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {status.localIps[0] && (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                            {status.localIps[0]}:{proxy.localPort}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(`${status.localIps[0]}:${proxy.localPort}`)}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            {t('proxy.actions.copy')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {t('proxy.hints.configureDevices')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onStop}
                disabled={loading}
                className="btn btn-danger"
              >
                {loading ? t('proxy.actions.stopping') : t('proxy.actions.stop')}
              </button>
              <button
                onClick={onRestart}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? t('proxy.actions.restarting') : t('proxy.actions.restart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View: Proxy List (when stopped)
  return (
    <div className="h-full flex flex-col card">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{t('proxy.title')}</h2>
          <span className="text-sm text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
            {proxyCount} {t('proxy.proxyCount')}
          </span>
        </div>
        <div
          className="text-xs text-gray-500 cursor-help"
          title={t('proxy.formatHint')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 mt-4 bg-red-900/50 border border-red-700 rounded-lg p-4 flex justify-between items-center">
          <span className="text-red-300 text-sm">{error}</span>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-300 ml-4"
          >
            {t('proxy.dismiss')}
          </button>
        </div>
      )}

      {/* Textarea - Scrollable */}
      <div className="flex-1 overflow-hidden mt-4">
        <textarea
          className="w-full h-full input font-mono text-sm resize-none"
          placeholder={t('proxy.placeholder')}
          value={localConfig.proxyList || ''}
          onChange={(e) => handleChange('proxyList', e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Settings */}
      <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">{t('proxy.settings.startPort')}</label>
            <input
              type="number"
              className="input"
              value={localConfig.startPort}
              onChange={(e) => handleChange('startPort', parseInt(e.target.value) || 8080)}
              min={1024}
              max={65535}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('proxy.settings.portsRange')}: {localConfig.startPort} - {localConfig.startPort + Math.max(0, proxyCount - 1)}
            </p>
          </div>

          <div>
            <label className="label">{t('proxy.settings.defaultAction')}</label>
            <select
              className="input"
              value={localConfig.defaultAction}
              onChange={(e) => handleChange('defaultAction', e.target.value as 'proxy' | 'direct')}
            >
              <option value="proxy">{t('proxy.settings.useProxy')}</option>
              <option value="direct">{t('proxy.settings.directConnection')}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('proxy.settings.whenNoRule')}
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
              <span className="text-gray-300 text-sm">{t('proxy.settings.autoStart')}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <button onClick={handleSave} className="btn btn-primary">
                  {t('proxy.actions.save')}
                </button>
                <button onClick={handleDiscard} className="btn btn-secondary">
                  {t('proxy.actions.discard')}
                </button>
              </>
            )}
          </div>
          <div className="relative group">
            <button
              onClick={onStart}
              disabled={loading || proxyCount === 0 || hasChanges}
              className="btn btn-success"
            >
              {loading ? t('proxy.actions.starting') : `${t('proxy.actions.start')} ${proxyCount} ${t('proxy.proxyCount')}`}
            </button>
            {hasChanges && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-gray-300 text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {t('proxy.hints.saveBeforeStart')}
              </div>
            )}
          </div>
        </div>

        {/* LAN IPs */}
        {status.localIps.length > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            {t('proxy.hints.yourLanIp')}: {status.localIps.map(ip => (
              <code key={ip} className="bg-gray-700 px-2 py-0.5 rounded ml-1">{ip}</code>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
