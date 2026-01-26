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

  // SVG pie chart calculations
  const size = 160;
  const center = size / 2;
  const radius = 60;
  const innerRadius = 40;

  // Create arc path for donut chart
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
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-white mb-3">Data Distribution</h3>

      <div className="flex items-center justify-center gap-6">
        {/* Pie Chart */}
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-0">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgb(55, 65, 81)"
              strokeWidth={radius - innerRadius}
            />

            {/* Proxy arc (purple) */}
            {proxyPercent > 0 && proxyPercent < 100 && (
              <path
                d={createArc(0, proxyAngle)}
                fill="rgb(147, 51, 234)"
                className="transition-all duration-500"
              />
            )}

            {/* Direct arc (green) */}
            {directPercent > 0 && directPercent < 100 && (
              <path
                d={createArc(proxyAngle, proxyAngle + directAngle)}
                fill="rgb(34, 197, 94)"
                className="transition-all duration-500"
              />
            )}

            {/* Full circle for 100% cases */}
            {proxyPercent >= 100 && (
              <circle
                cx={center}
                cy={center}
                r={(radius + innerRadius) / 2}
                fill="none"
                stroke="rgb(147, 51, 234)"
                strokeWidth={radius - innerRadius}
              />
            )}
            {directPercent >= 100 && (
              <circle
                cx={center}
                cy={center}
                r={(radius + innerRadius) / 2}
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth={radius - innerRadius}
              />
            )}

            {/* Center text */}
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              className="fill-white font-bold text-xl"
            >
              {stats.savingsPercent}%
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="fill-gray-400 text-xs"
            >
              {t('dashboard.stats.savings')}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <div>
              <div className="text-sm text-gray-300">{t('dashboard.chart.proxy')}</div>
              <div className="text-xs text-gray-500">
                {formatBytes(stats.proxyBytes)} ({proxyPercent.toFixed(1)}%)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div>
              <div className="text-sm text-gray-300">{t('dashboard.chart.direct')}</div>
              <div className="text-xs text-gray-500">
                {formatBytes(stats.directBytes)} ({directPercent.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
