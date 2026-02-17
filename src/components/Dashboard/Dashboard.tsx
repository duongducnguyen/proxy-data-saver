import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { useStats } from '../../hooks/useStats';
import { StatsCards } from './StatsCards';
import { PeriodSelector } from './PeriodSelector';
import { TopDomains } from './TopDomains';
import { DataChart } from './DataChart';

export function Dashboard() {
  const { t } = useI18n();
  const { stats, period, selectedProxy, proxyPorts, loading, changePeriod, changeProxy, resetStats } = useStats();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = async () => {
    await resetStats();
    setShowResetConfirm(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.title')}</h2>
        <div className="flex items-center gap-3">
          {proxyPorts.length > 0 && (
            <select
              value={selectedProxy ?? 'all'}
              onChange={(e) => changeProxy(e.target.value === 'all' ? undefined : Number(e.target.value))}
              className="bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-xs px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-800 focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-700"
              disabled={loading}
            >
              <option value="all">{t('dashboard.filter.allProxies')}</option>
              {proxyPorts.map(port => (
                <option key={port} value={port}>Port {port}</option>
              ))}
            </select>
          )}
          <PeriodSelector period={period} onChange={changePeriod} loading={loading} />
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-1.5 text-neutral-500 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors"
            title={t('dashboard.actions.reset')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-sm mx-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">{t('dashboard.actions.reset')}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-5">{t('dashboard.actions.confirmReset')}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleReset} className="btn btn-danger">
                {t('dashboard.actions.reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading && !stats ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-neutral-500 dark:text-neutral-600 text-sm">Loading...</div>
        </div>
      ) : !stats || stats.totalBytes === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-neutral-400 dark:text-neutral-700 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-600">{t('dashboard.noData')}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <StatsCards stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
            <DataChart stats={stats} />
            <TopDomains domains={stats.topDomains} />
          </div>
        </div>
      )}
    </div>
  );
}
