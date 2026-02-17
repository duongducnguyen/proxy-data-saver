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
    },
    {
      label: t('dashboard.stats.proxyData'),
      value: formatBytes(stats.proxyBytes),
    },
    {
      label: t('dashboard.stats.directData'),
      value: formatBytes(stats.directBytes),
      highlight: true,
    },
    {
      label: t('dashboard.stats.savings'),
      value: `${stats.savingsPercent}%`,
      subValue: stats.requestCount > 0 ? `${stats.requestCount} ${t('dashboard.stats.requests').toLowerCase()}` : undefined,
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-neutral-100 dark:bg-neutral-900/50 rounded-lg p-4">
          <div className="text-xs text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">
            {card.label}
          </div>
          <div className={`text-2xl font-semibold tabular-nums ${card.highlight ? 'text-green-600 dark:text-success-text' : 'text-neutral-900 dark:text-neutral-100'}`}>
            {card.value}
          </div>
          {card.subValue && (
            <div className="text-xs text-neutral-500 dark:text-neutral-600 mt-1">{card.subValue}</div>
          )}
        </div>
      ))}
    </div>
  );
}
