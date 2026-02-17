import React from 'react';
import { useI18n } from '../../i18n';
import { formatBytes } from '../../utils/formatBytes';

interface Stats {
  totalBytes: number;
  proxyBytes: number;
  directBytes: number;
  savingsPercent: number;
}

interface DataChartProps {
  stats: Stats;
}

export function DataChart({ stats }: DataChartProps) {
  const { t } = useI18n();

  const total = stats.totalBytes;
  const proxyPercent = total > 0 ? (stats.proxyBytes / total) * 100 : 0;
  const directPercent = total > 0 ? (stats.directBytes / total) * 100 : 0;

  // SVG donut chart
  const size = 140;
  const center = size / 2;
  const radius = 54;
  const innerRadius = 38;

  const createArc = (startAngle: number, endAngle: number): string => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const x3 = center + innerRadius * Math.cos(endRad);
    const y3 = center + innerRadius * Math.sin(endRad);
    const x4 = center + innerRadius * Math.cos(startRad);
    const y4 = center + innerRadius * Math.sin(startRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  const proxyAngle = (proxyPercent / 100) * 360;
  const directAngle = (directPercent / 100) * 360;

  return (
    <div className="bg-neutral-900/50 rounded-lg p-4">
      <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-4">Data Distribution</h3>

      <div className="flex items-center justify-center gap-8">
        {/* Chart */}
        <div className="relative">
          <svg width={size} height={size}>
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={(radius + innerRadius) / 2}
              fill="none"
              stroke="#262626"
              strokeWidth={radius - innerRadius}
            />

            {/* Proxy arc */}
            {proxyPercent > 0 && proxyPercent < 100 && (
              <path
                d={createArc(0, proxyAngle)}
                fill="#525252"
                className="transition-all duration-500"
              />
            )}

            {/* Direct arc */}
            {directPercent > 0 && directPercent < 100 && (
              <path
                d={createArc(proxyAngle, proxyAngle + directAngle)}
                fill="#22c55e"
                className="transition-all duration-500"
              />
            )}

            {/* Full circle cases */}
            {proxyPercent >= 100 && (
              <circle
                cx={center}
                cy={center}
                r={(radius + innerRadius) / 2}
                fill="none"
                stroke="#525252"
                strokeWidth={radius - innerRadius}
              />
            )}
            {directPercent >= 100 && (
              <circle
                cx={center}
                cy={center}
                r={(radius + innerRadius) / 2}
                fill="none"
                stroke="#22c55e"
                strokeWidth={radius - innerRadius}
              />
            )}

            {/* Center text */}
            <text
              x={center}
              y={center - 4}
              textAnchor="middle"
              className="fill-neutral-100 font-semibold text-xl"
            >
              {stats.savingsPercent}%
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="fill-neutral-500 text-2xs uppercase"
            >
              saved
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
            <div>
              <div className="text-sm text-neutral-300">{t('dashboard.chart.proxy')}</div>
              <div className="text-xs text-neutral-600">
                {formatBytes(stats.proxyBytes)} ({proxyPercent.toFixed(0)}%)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
            <div>
              <div className="text-sm text-neutral-300">{t('dashboard.chart.direct')}</div>
              <div className="text-xs text-neutral-600">
                {formatBytes(stats.directBytes)} ({directPercent.toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
