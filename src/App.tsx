import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProxyConfig } from './components/ProxyConfig';
import { RuleManager } from './components/RuleManager';
import { TrafficMonitor } from './components/TrafficMonitor';
import { useProxy } from './hooks/useProxy';
import { useRules } from './hooks/useRules';
import { useTraffic } from './hooks/useTraffic';
import { I18nProvider, useI18n, Language } from './i18n';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import logoDark from './assets/logo-dark.png';
import logoLight from './assets/logo-light.png';

type Tab = 'dashboard' | 'proxy' | 'rules' | 'traffic';

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className="bg-transparent text-neutral-500 text-xs px-1 py-0.5 rounded border-0 focus:outline-none cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
    >
      <option value="en" className="bg-white dark:bg-neutral-900">{t('language.en')}</option>
      <option value="vi" className="bg-white dark:bg-neutral-900">{t('language.vi')}</option>
    </select>
  );
}

function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Light mode' : 'Dark mode'}
      className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors p-1"
    >
      {theme === 'light' ? (
        // Sun icon
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI?.window.isMaximized().then(setIsMaximized);
    const unsub = window.electronAPI?.window.onMaximizedChange(setIsMaximized);
    return () => unsub?.();
  }, []);

  return (
    <div className="flex items-center">
      <button
        onClick={() => window.electronAPI?.window.minimize()}
        className="w-10 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      >
        <svg className="w-2.5 h-0.5" fill="currentColor" viewBox="0 0 10 2">
          <rect width="10" height="2" />
        </svg>
      </button>
      <button
        onClick={() => window.electronAPI?.window.maximize()}
        className="w-10 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      >
        {isMaximized ? (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <rect x="2" y="3" width="5" height="5" />
            <path d="M3 3V2h5v5h-1" />
          </svg>
        ) : (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="1" width="8" height="8" />
          </svg>
        )}
      </button>
      <button
        onClick={() => window.electronAPI?.window.close()}
        className="w-10 h-7 flex items-center justify-center text-neutral-500 hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l8 8M9 1L1 9" />
        </svg>
      </button>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { t } = useI18n();
  const { theme } = useTheme();

  const proxy = useProxy();
  const rules = useRules();
  const traffic = useTraffic();

  const runningCount = proxy.status.proxies.filter(p => p.running).length;
  const totalCount = proxy.status.proxies.length;

  const tabs: { id: Tab; label: string; count?: number | string }[] = [
    { id: 'dashboard', label: t('tabs.dashboard') },
    { id: 'proxy', label: t('tabs.proxy'), count: proxy.status.running ? `${runningCount}/${totalCount}` : undefined },
    { id: 'rules', label: t('tabs.rules'), count: rules.rules.length || undefined },
    { id: 'traffic', label: t('tabs.traffic'), count: traffic.logs.length || undefined }
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Titlebar */}
      <div
        className="flex-shrink-0 h-7 flex items-center justify-between select-none border-b border-neutral-200 dark:border-neutral-900"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 px-3">
          <img
            src={theme === 'dark' ? logoLight : logoDark}
            alt="Logo"
            className="w-3.5 h-3.5"
          />
          <span className="text-2xs text-neutral-500 dark:text-neutral-600 font-medium tracking-wide uppercase">
            {t('app.title')}
          </span>
          <span className="text-2xs text-neutral-400 dark:text-neutral-700">
            v{__APP_VERSION__}
          </span>
        </div>
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <ThemeSwitcher />
          <WindowControls />
        </div>
      </div>

      {/* Navigation */}
      <header className="flex-shrink-0 px-6 pt-4 pb-3">
        <div className="flex items-center justify-between">
          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  activeTab === tab.id
                    ? 'text-neutral-900 bg-neutral-200 dark:text-neutral-100 dark:bg-neutral-800'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-900'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 text-xs ${
                    activeTab === tab.id ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`status-dot ${proxy.status.running ? 'status-dot-active' : 'status-dot-inactive'}`} />
              <span className="text-xs text-neutral-500">
                {proxy.status.running
                  ? `${runningCount} ${t('app.status.running')}`
                  : t('app.status.stopped')}
              </span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden px-6 pb-4">
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
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 px-6 py-2 border-t border-neutral-200 dark:border-neutral-900">
        <div className="flex items-center justify-between text-2xs text-neutral-500 dark:text-neutral-600">
          <div className="flex-1">
            {proxy.status.running && proxy.status.localIps.length > 0 && (
              <span>
                LAN: <code className="text-neutral-700 dark:text-neutral-400 font-mono">{proxy.status.localIps[0]}</code>
              </span>
            )}
          </div>
          <div className="flex-1 text-center text-neutral-400 dark:text-neutral-700">
            by{' '}
            <a
              href="https://app.woware.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 dark:text-indigo-400 underline hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            >
              Woware
            </a>
          </div>
          <div className="flex-1 flex items-center justify-end gap-4">
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
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
