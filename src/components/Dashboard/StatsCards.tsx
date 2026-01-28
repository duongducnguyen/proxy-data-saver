import React from 'react';
import { useI18n } from '../../i18n';
import { formatBytes } from '../../utils/formatBytes';

interface Stats {
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  savingsPercent: number;
  requestCount: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useI18n();

  const cards = [
    {
      label: t('dashboard.stats.totalData'),
      value: formatBytes(stats.totalBytes),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: t('dashboard.stats.proxyData'),
      value: formatBytes(stats.proxyBytes),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: t('dashboard.stats.directData'),
      value: formatBytes(stats.directBytes),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      label: t('dashboard.stats.savings'),
      value: `${stats.savingsPercent}%`,
      subValue: stats.requestCount > 0 ? `${stats.requestCount} ${t('dashboard.stats.requests').toLowerCase()}` : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: stats.savingsPercent >= 50 ? 'text-green-400' : stats.savingsPercent >= 25 ? 'text-yellow-400' : 'text-gray-400',
      bgColor: stats.savingsPercent >= 50 ? 'bg-green-500/10' : stats.savingsPercent >= 25 ? 'bg-yellow-500/10' : 'bg-gray-500/10',
      highlight: true
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg p-4 border border-gray-700/50`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={card.color}>{card.icon}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wide">{card.label}</span>
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          {card.subValue && (
            <div className="text-xs text-gray-500 mt-1">{card.subValue}</div>
          )}
        </div>
      ))}
    </div>
  );
}
