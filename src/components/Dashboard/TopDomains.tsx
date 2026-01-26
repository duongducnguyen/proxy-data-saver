import React from 'react';
import { useI18n } from '../../i18n';
import { formatBytes } from '../../utils/formatBytes';

interface DomainStats {
  hostname: string;
  totalBytes: number;
  action: 'proxy' | 'direct' | 'mixed';
  requestCount: number;
}

interface TopDomainsProps {
  domains: DomainStats[];
}

export function TopDomains({ domains }: TopDomainsProps) {
  const { t } = useI18n();

  const maxBytes = domains.length > 0 ? Math.max(...domains.map(d => d.totalBytes)) : 0;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-white mb-3">{t('dashboard.topDomains.title')}</h3>

      {domains.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {t('dashboard.topDomains.noData')}
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-auto">
          {domains.slice(0, 10).map((domain, index) => (
            <div key={domain.hostname} className="relative">
              {/* Background bar */}
              <div
                className={`absolute inset-0 rounded ${
                  domain.action === 'proxy' ? 'bg-purple-500/10' :
                  domain.action === 'direct' ? 'bg-green-500/10' :
                  'bg-gray-500/10'
                }`}
                style={{ width: `${(domain.totalBytes / maxBytes) * 100}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between py-2 px-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-500 text-xs w-4 flex-shrink-0">{index + 1}</span>
                  <span className="text-sm text-gray-300 truncate">{domain.hostname}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    domain.action === 'proxy' ? 'bg-purple-500/20 text-purple-400' :
                    domain.action === 'direct' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {domain.action === 'proxy' ? 'P' : domain.action === 'direct' ? 'D' : 'M'}
                  </span>
                  <span className="text-sm text-gray-400 w-20 text-right">
                    {formatBytes(domain.totalBytes)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
