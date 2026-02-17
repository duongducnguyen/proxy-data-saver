import React from 'react';
import { useI18n } from '../../i18n';
import { StatsPeriod } from '../../hooks/useStats';

interface PeriodSelectorProps {
  period: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
  loading?: boolean;
}

export function PeriodSelector({ period, onChange, loading }: PeriodSelectorProps) {
  const { t } = useI18n();

  const periods: { id: StatsPeriod; labelKey: string }[] = [
    { id: 'today', labelKey: 'dashboard.period.today' },
    { id: 'week', labelKey: 'dashboard.period.week' },
    { id: 'month', labelKey: 'dashboard.period.month' },
    { id: 'all', labelKey: 'dashboard.period.all' }
  ];

  return (
    <div className="flex bg-neutral-900 rounded p-0.5 gap-0.5">
      {periods.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          disabled={loading}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            period === p.id
              ? 'bg-neutral-800 text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-300'
          } ${loading ? 'opacity-50' : ''}`}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  );
}
