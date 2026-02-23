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
  startWithWindows: boolean;
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

  // Running view
  if (status.running) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('proxy.titleActive')}</h2>
            <span className="flex items-center gap-2 text-xs text-green-600 dark:text-success-text">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {runningCount}/{status.proxies.length} {t('proxy.status.running')}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onStop} disabled={loading} className="btn btn-ghost">
              {loading ? t('proxy.actions.stopping') : t('proxy.actions.stop')}
            </button>
            <button onClick={onRestart} disabled={loading} className="btn btn-secondary">
              {loading ? t('proxy.actions.restarting') : t('proxy.actions.restart')}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex-shrink-0 mb-4 bg-danger-muted rounded-lg p-3 flex justify-between items-center">
            <span className="text-danger dark:text-danger-text text-sm">{error}</span>
            <button onClick={onClearError} className="text-danger dark:text-danger-text hover:text-red-600 dark:hover:text-red-300 text-sm">
              {t('proxy.dismiss')}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-950">
                <tr className="text-left text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">{t('proxy.table.localPort')}</th>
                  <th className="pb-3 font-medium">{t('proxy.table.upstream')}</th>
                  <th className="pb-3 font-medium">{t('proxy.table.status')}</th>
                  <th className="pb-3 font-medium">
                    <div className="flex items-center gap-2">
                      {t('proxy.table.lanAddress')}
                      {status.localIps[0] && status.proxies.length > 0 && (
                        <button
                          onClick={() => {
                            const allAddresses = status.proxies
                              .map(p => `${status.localIps[0]}:${p.localPort}`)
                              .join('\n');
                            navigator.clipboard.writeText(allAddresses);
                          }}
                          className="text-2xs font-normal normal-case text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          {t('proxy.actions.copyAll')}
                        </button>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-900">
                {status.proxies.map((proxy) => (
                  <tr key={proxy.id} className="group">
                    <td className="py-3">
                      <span className="font-mono text-neutral-900 dark:text-neutral-100 text-base">{proxy.localPort}</span>
                    </td>
                    <td className="py-3">
                      <div className="text-neutral-700 dark:text-neutral-300 font-mono text-sm">{proxy.host}:{proxy.port}</div>
                      {proxy.username && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-600">{proxy.username}</div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${
                        proxy.running ? 'text-green-600 dark:text-success-text' : 'text-danger dark:text-danger-text'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          proxy.running ? 'bg-success' : 'bg-danger'
                        }`} />
                        {proxy.running ? t('proxy.status.ok') : t('proxy.status.failed')}
                      </span>
                    </td>
                    <td className="py-3">
                      {status.localIps[0] && (
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                            {status.localIps[0]}:{proxy.localPort}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(`${status.localIps[0]}:${proxy.localPort}`)}
                            className="text-xs text-neutral-500 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-400 transition-colors opacity-0 group-hover:opacity-100"
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

        {/* Footer hint */}
        <div className="flex-shrink-0 pt-4 text-xs text-neutral-500 dark:text-neutral-600">
          {t('proxy.hints.configureDevices')}
        </div>
      </div>
    );
  }

  // Config view
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('proxy.title')}</h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-600">
            {proxyCount} {t('proxy.proxyCount')}
          </span>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <button onClick={handleDiscard} className="btn btn-ghost">
                {t('proxy.actions.discard')}
              </button>
              <button onClick={handleSave} className="btn btn-secondary">
                {t('proxy.actions.save')}
              </button>
            </>
          )}
          <button
            onClick={onStart}
            disabled={loading || proxyCount === 0 || hasChanges}
            className="btn btn-primary"
          >
            {loading ? t('proxy.actions.starting') : t('proxy.actions.start')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 mb-4 bg-danger-muted rounded-lg p-3 flex justify-between items-center">
          <span className="text-danger dark:text-danger-text text-sm">{error}</span>
          <button onClick={onClearError} className="text-danger dark:text-danger-text hover:text-red-600 dark:hover:text-red-300 text-sm">
            {t('proxy.dismiss')}
          </button>
        </div>
      )}

      {/* Proxy list textarea */}
      <div className="flex-1 overflow-hidden mb-5">
        <textarea
          className="w-full h-full input font-mono text-sm resize-none"
          placeholder={t('proxy.placeholder')}
          value={localConfig.proxyList || ''}
          onChange={(e) => handleChange('proxyList', e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Settings */}
      <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 border-t border-neutral-200 dark:border-neutral-900">
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
          <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-1.5">
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
          <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-1.5">
            {t('proxy.settings.whenNoRule')}
          </p>
        </div>

        <div>
          <label className="label">{t('proxy.settings.startWithWindows')}</label>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={localConfig.startWithWindows ?? false}
              onChange={(e) => handleChange('startWithWindows', e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {t('proxy.settings.startWithWindowsHint')}
            </span>
          </label>
        </div>

      </div>

      {/* LAN IPs */}
      {status.localIps.length > 0 && (
        <div className="flex-shrink-0 mt-4 text-xs text-neutral-500 dark:text-neutral-600">
          {t('proxy.hints.yourLanIp')}: {status.localIps.map(ip => (
            <code key={ip} className="text-neutral-600 dark:text-neutral-400 font-mono ml-1">{ip}</code>
          ))}
        </div>
      )}
    </div>
  );
}
