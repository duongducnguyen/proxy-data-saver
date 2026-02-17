import React, { useState, useEffect } from 'react';
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
  rule: Rule | null;
  existingPriorities: number[];
  onSave: (rule: Omit<Rule, 'id'>) => void;
  onCancel: () => void;
  onValidate: (pattern: string) => Promise<{ valid: boolean; error?: string }>;
}

function patternToLines(pattern: string): string {
  if (!pattern) return '';
  return pattern.split(',').map(p => p.trim()).filter(Boolean).join('\n');
}

function linesToPattern(lines: string): string {
  if (!lines) return '';
  return lines.split('\n').map(l => l.trim()).filter(Boolean).join(', ');
}

export function RuleEditor({ rule, existingPriorities, onSave, onCancel, onValidate }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(rule?.name || '');
  const [pattern, setPattern] = useState(patternToLines(rule?.pattern || ''));
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
      const result = await onValidate(linesToPattern(pattern));
      setPatternError(result.valid ? null : result.error || t('rules.form.patternInvalid'));
      setValidating(false);
    };

    const debounce = setTimeout(validatePattern, 300);
    return () => clearTimeout(debounce);
  }, [pattern, onValidate, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pattern || patternError) return;

    onSave({
      name,
      pattern: linesToPattern(pattern),
      action,
      enabled,
      priority
    });
  };

  const isValid = name && pattern && !patternError && !validating;

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-900/50 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-medium text-neutral-200">
        {rule ? t('rules.editRule') : t('rules.addRule')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t('rules.form.name')}</label>
          <input
            type="text"
            className="input"
            placeholder={t('rules.form.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">{t('rules.form.action')}</label>
          <select
            className="input"
            value={action}
            onChange={(e) => setAction(e.target.value as 'proxy' | 'direct')}
          >
            <option value="proxy">{t('rules.form.useProxy')}</option>
            <option value="direct">{t('rules.form.directConnection')}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="label">{t('rules.form.pattern')}</label>
          <textarea
            className={`input min-h-[100px] resize-y font-mono text-sm ${patternError ? 'border-danger' : ''}`}
            placeholder={t('rules.form.patternPlaceholder')}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            required
          />
          {patternError && (
            <p className="text-danger-text text-xs mt-1">{patternError}</p>
          )}
          <p className="text-xs text-neutral-600 mt-1">
            {t('rules.form.patternHint')}
          </p>
        </div>

        <div>
          <label className="label">{t('rules.form.priority')}</label>
          <input
            type="number"
            className="input"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 100)}
            min={1}
          />
          <p className="text-xs text-neutral-600 mt-1">
            {t('rules.form.priorityHint')}
          </p>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer mt-6">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-accent focus:ring-accent/50"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-sm text-neutral-400">{t('rules.form.enabled')}</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={!isValid} className="btn btn-primary">
          {t('rules.form.save')}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          {t('rules.form.cancel')}
        </button>
      </div>
    </form>
  );
}
