import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProxyConfig } from './components/ProxyConfig';
import { RuleManager } from './components/RuleManager';
import { TrafficMonitor } from './components/TrafficMonitor';
import { useProxy } from './hooks/useProxy';
import { useRules } from './hooks/useRules';
import { useTraffic } from './hooks/useTraffic';
import { I18nProvider, useI18n, Language } from './i18n';

type Tab = 'dashboard' | 'proxy' | 'rules' | 'traffic';

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="en">{t('language.en')}</option>
      <option value="vi">{t('language.vi')}</option>
    </select>
  );
}

function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Get initial state
    window.electronAPI?.window.isMaximized().then(setIsMaximized);

    // Subscribe to changes
    const unsub = window.electronAPI?.window.onMaximizedChange(setIsMaximized);
    return () => unsub?.();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.window.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.window.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.window.close();
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleMinimize}
        className="w-11 h-8 flex items-center justify-center hover:bg-gray-700 transition-colors"
        title="Minimize"
      >
        <svg className="w-3 h-0.5" fill="currentColor" viewBox="0 0 12 2">
          <rect width="12" height="2" />
        </svg>
      </button>
      <button
        onClick={handleMaximize}
        className="w-11 h-8 flex items-center justify-center hover:bg-gray-700 transition-colors"
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          // Restore icon (two overlapping squares)
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.2">
            <rect x="2" y="4" width="6" height="6" />
            <path d="M4 4V2h6v6h-2" />
          </svg>
        ) : (
          // Maximize icon (single square)
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="1" width="10" height="10" />
          </svg>
        )}
      </button>
      <button
        onClick={handleClose}
        className="w-11 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
        title="Close"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l10 10M11 1L1 11" />
        </svg>
      </button>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { t } = useI18n();

  const proxy = useProxy();
  const rules = useRules();
  const traffic = useTraffic();

  const runningCount = proxy.status.proxies.filter(p => p.running).length;
  const totalCount = proxy.status.proxies.length;

  const tabs: { id: Tab; labelKey: string; badge?: number | string }[] = [
    { id: 'dashboard', labelKey: 'tabs.dashboard' },
    { id: 'proxy', labelKey: 'tabs.proxy', badge: proxy.status.running ? `${runningCount}/${totalCount}` : undefined },
    { id: 'rules', labelKey: 'tabs.rules', badge: rules.rules.length },
    { id: 'traffic', labelKey: 'tabs.traffic', badge: traffic.logs.length > 0 ? traffic.logs.length : undefined }
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
      {/* Custom Titlebar */}
      <div
        className="flex-shrink-0 h-8 bg-gray-900 flex items-center justify-between select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 px-3">
          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs text-gray-400">{t('app.title')}</span>
        </div>
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <WindowControls />
        </div>
      </div>

      <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            <nav className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-400 bg-gray-700/50 rounded-t'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {t(tab.labelKey)}
                  {tab.badge !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-700 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                  proxy.status.running
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${proxy.status.running ? 'bg-green-500' : 'bg-gray-500'}`} />
                {proxy.status.running
                  ? `${runningCount} ${t('app.status.running')}`
                  : t('app.status.stopped')}
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto px-4 py-4">
          {activeTab === 'dashboard' && <Dashboard />}

          {activeTab === 'proxy' && (
            <ProxyConfig
              status={proxy.status}
              config={proxy.config}
              loading={proxy.loading}
              error={proxy.error}
              onStart={proxy.start}
              onStop={proxy.stop}
              onRestart={proxy.restart}
              onUpdateConfig={proxy.updateConfig}
              onClearError={proxy.clearError}
            />
          )}

          {activeTab === 'rules' && (
            <RuleManager
              rules={rules.rules}
              loading={rules.loading}
              error={rules.error}
              onAddRule={rules.addRule}
              onUpdateRule={rules.updateRule}
              onDeleteRule={rules.deleteRule}
              onReorderRules={rules.reorderRules}
              onTestRule={rules.testRule}
              onValidatePattern={rules.validatePattern}
              onClearError={rules.clearError}
            />
          )}

          {activeTab === 'traffic' && (
            <TrafficMonitor
              logs={traffic.logs}
              paused={traffic.paused}
              onClear={traffic.clear}
              onTogglePause={traffic.togglePause}
              stats={traffic.getStats()}
              proxies={proxy.status.proxies}
            />
          )}
        </div>
      </main>

      <footer className="flex-shrink-0 bg-gray-800/50 border-t border-gray-700/50 py-1.5 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <div>
            {proxy.status.running && proxy.status.localIps.length > 0 && (
              <span>
                {t('footer.lan')}: <code className="text-blue-400">{proxy.status.localIps[0]}</code>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>{t('footer.proxies')}: {runningCount}/{totalCount}</span>
            <span>{t('footer.rules')}: {rules.rules.filter(r => r.enabled).length} {t('footer.active')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
