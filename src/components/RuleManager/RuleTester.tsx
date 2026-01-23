import React, { useState } from 'react';

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
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-4">
      <h3 className="font-medium text-white">Test Hostname Against Rules</h3>

      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Enter hostname to test (e.g., www.google.com)"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTest()}
        />
        <button
          onClick={handleTest}
          disabled={!hostname || testing}
          className="btn btn-primary"
        >
          {testing ? 'Testing...' : 'Test'}
        </button>
      </div>

      {results && (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${matchingRule ? 'bg-blue-900/30 border border-blue-700' : 'bg-yellow-900/30 border border-yellow-700'}`}>
            <span className="font-medium">
              {matchingRule ? (
                <>
                  Matched: <span className="text-blue-300">{matchingRule.name}</span>
                  {' '}&rarr;{' '}
                  <span className={matchingRule.action === 'proxy' ? 'text-blue-400' : 'text-green-400'}>
                    {matchingRule.action === 'proxy' ? 'Use Proxy' : 'Direct Connection'}
                  </span>
                </>
              ) : (
                <span className="text-yellow-300">No rule matched - will use default action</span>
              )}
            </span>
          </div>

          <div className="text-sm">
            <div className="text-gray-400 mb-2">Rule evaluation:</div>
            <div className="space-y-1">
              {results.map(({ rule, matches }) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${
                    matches ? 'bg-green-900/30' : 'bg-gray-800'
                  }`}
                >
                  <span className={matches ? 'text-green-400' : 'text-gray-500'}>
                    {matches ? '✓' : '✗'}
                  </span>
                  <span className={matches ? 'text-white' : 'text-gray-500'}>
                    {rule.name}
                  </span>
                  <code className="text-xs text-gray-500">{rule.pattern}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
