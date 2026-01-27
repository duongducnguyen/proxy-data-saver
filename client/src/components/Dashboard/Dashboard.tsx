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
      {/* Header with period and proxy selector */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{t('dashboard.title')}</h2>
        <div className="flex items-center gap-2">
          {/* Proxy filter */}
          {proxyPorts.length > 0 && (
            <select
              value={selectedProxy ?? 'all'}
              onChange={(e) => changeProxy(e.target.value === 'all' ? undefined : Number(e.target.value))}
              className="bg-gray-800 text-gray-300 text-sm px-2 py-1.5 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="all">{t('dashboard.filter.allProxies')}</option>
              {proxyPorts.map(port => (
                <option key={port} value={port}>Port {port}</option>
              ))}
            </select>
          )}
          <PeriodSelector
            period={period}
            onChange={changePeriod}
            loading={loading}
          />
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-2 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
            title={t('dashboard.actions.reset')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-3">{t('dashboard.actions.reset')}</h3>
            <p className="text-gray-400 mb-4">{t('dashboard.actions.confirmReset')}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                {t('dashboard.actions.reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {loading && !stats ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : !stats || stats.totalBytes === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>{t('dashboard.noData')}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Stats cards */}
          <StatsCards stats={stats} />

          {/* Chart and Top Domains */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <DataChart stats={stats} />
            <TopDomains domains={stats.topDomains} />
          </div>
        </div>
      )}
    </div>
  );
}
