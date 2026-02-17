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
    <div className="bg-neutral-900/50 rounded-lg p-4">
      <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-4">{t('dashboard.topDomains.title')}</h3>

      {domains.length === 0 ? (
        <div className="text-center text-neutral-600 py-8 text-sm">
          {t('dashboard.topDomains.noData')}
        </div>
      ) : (
        <div className="space-y-1 max-h-56 overflow-auto">
          {domains.slice(0, 10).map((domain, index) => (
            <div key={domain.hostname} className="relative group">
              {/* Background bar */}
              <div
                className="absolute inset-0 rounded bg-neutral-800/50 transition-all"
                style={{ width: `${(domain.totalBytes / maxBytes) * 100}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between py-2 px-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-neutral-600 text-xs w-4 flex-shrink-0 tabular-nums">{index + 1}</span>
                  <span className="text-sm text-neutral-300 truncate font-mono">{domain.hostname}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-2xs px-1.5 py-0.5 rounded font-medium ${
                    domain.action === 'direct'
                      ? 'text-success-text'
                      : 'text-neutral-500'
                  }`}>
                    {domain.action === 'proxy' ? 'P' : domain.action === 'direct' ? 'D' : 'M'}
                  </span>
                  <span className="text-xs text-neutral-500 w-16 text-right tabular-nums">
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
