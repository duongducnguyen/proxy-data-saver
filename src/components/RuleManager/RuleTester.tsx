import React, { useState } from 'react';
import { useTranslation } from '../../i18n';

interface Rule {
  id: string;
  name: string;
  pattern: string;
  action: 'proxy' | 'direct';
  enabled: boolean;
  priority: number;
}

interface Props {
  onTest: (pattern: string, hostname: string) => Promise<boolean>;
  rules: Rule[];
}

export function RuleTester({ onTest, rules }: Props) {
  const { t } = useTranslation();
  const [hostname, setHostname] = useState('');
  const [results, setResults] = useState<{ rule: Rule; matches: boolean }[] | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    if (!hostname) return;

    setTesting(true);
    const testResults: { rule: Rule; matches: boolean }[] = [];

    for (const rule of rules) {
      if (rule.enabled) {
        const matches = await onTest(rule.pattern, hostname);
        testResults.push({ rule, matches });
      }
    }

    setResults(testResults);
    setTesting(false);
  };

  const matchingRule = results?.find((r) => r.matches)?.rule;

  return (
    <div className="bg-neutral-900/50 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-medium text-neutral-200">{t('rules.tester.title')}</h3>

      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder={t('rules.tester.hostnamePlaceholder')}
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTest()}
        />
        <button
          onClick={handleTest}
          disabled={!hostname || testing}
          className="btn btn-secondary"
        >
          {testing ? t('rules.tester.testing') : t('rules.tester.test')}
        </button>
      </div>

      {results && (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${matchingRule ? 'bg-neutral-800' : 'bg-neutral-800/50'}`}>
            <span className="text-sm">
              {matchingRule ? (
                <>
                  {t('rules.tester.matchedRule')}: <span className="text-neutral-100 font-medium">{matchingRule.name}</span>
                  {' → '}
                  <span className={matchingRule.action === 'direct' ? 'text-success-text' : 'text-neutral-400'}>
                    {matchingRule.action === 'proxy' ? t('rules.tester.action.proxy') : t('rules.tester.action.direct')}
                  </span>
                </>
              ) : (
                <span className="text-neutral-500">{t('rules.tester.noMatch')}</span>
              )}
            </span>
          </div>

          <div className="text-sm">
            <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{t('rules.tester.result')}:</div>
            <div className="space-y-1">
              {results.map(({ rule, matches }) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                    matches ? 'bg-neutral-800' : ''
                  }`}
                >
                  <span className={matches ? 'text-success-text' : 'text-neutral-600'}>
                    {matches ? '✓' : '✗'}
                  </span>
                  <span className={matches ? 'text-neutral-200' : 'text-neutral-600'}>
                    {rule.name}
                  </span>
                  <code className="text-xs text-neutral-600 font-mono">{rule.pattern}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
