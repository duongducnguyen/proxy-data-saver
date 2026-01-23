import React, { useState, useEffect } from 'react';

interface Rule {
  id: string;
  name: string;
  pattern: string;
  action: 'proxy' | 'direct';
  enabled: boolean;
  priority: number;
}

interface Props {
  rule: Rule | null;
  existingPriorities: number[];
  onSave: (rule: Omit<Rule, 'id'>) => void;
  onCancel: () => void;
  onValidate: (pattern: string) => Promise<{ valid: boolean; error?: string }>;
}

export function RuleEditor({ rule, existingPriorities, onSave, onCancel, onValidate }: Props) {
  const [name, setName] = useState(rule?.name || '');
  const [pattern, setPattern] = useState(rule?.pattern || '');
  const [action, setAction] = useState<'proxy' | 'direct'>(rule?.action || 'proxy');
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [priority, setPriority] = useState(rule?.priority || getNextPriority());
  const [patternError, setPatternError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  function getNextPriority(): number {
    if (existingPriorities.length === 0) return 100;
    return Math.max(...existingPriorities) + 10;
  }

  useEffect(() => {
    const validatePattern = async () => {
      if (!pattern) {
        setPatternError(null);
        return;
      }
      setValidating(true);
      const result = await onValidate(pattern);
      setPatternError(result.valid ? null : result.error || 'Invalid pattern');
      setValidating(false);
    };

    const debounce = setTimeout(validatePattern, 300);
    return () => clearTimeout(debounce);
  }, [pattern, onValidate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pattern || patternError) return;

    onSave({
      name,
      pattern,
      action,
      enabled,
      priority
    });
  };

  const isValid = name && pattern && !patternError && !validating;

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-4">
      <h3 className="font-medium text-white">
        {rule ? 'Edit Rule' : 'Add New Rule'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Rule Name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Google Services"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Action</label>
          <select
            className="input"
            value={action}
            onChange={(e) => setAction(e.target.value as 'proxy' | 'direct')}
          >
            <option value="proxy">Use Proxy</option>
            <option value="direct">Direct Connection</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="label">Pattern</label>
          <input
            type="text"
            className={`input ${patternError ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="e.g., *.google.com, facebook.com, 192.168.*"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            required
          />
          {patternError && (
            <p className="text-red-400 text-sm mt-1">{patternError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Use * as wildcard. Examples: *.google.com, facebook.com, 192.168.*, *.local
          </p>
        </div>

        <div>
          <label className="label">Priority</label>
          <input
            type="number"
            className="input"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 100)}
            min={1}
          />
          <p className="text-xs text-gray-500 mt-1">
            Lower number = higher priority
          </p>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer mt-6">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-gray-300">Enabled</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!isValid}
          className="btn btn-primary"
        >
          {rule ? 'Save Changes' : 'Add Rule'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
