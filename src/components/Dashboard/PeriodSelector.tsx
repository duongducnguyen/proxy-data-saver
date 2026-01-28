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
    <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
      {periods.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          disabled={loading}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            period === p.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          } ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  );
}
