import React from 'react';
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
  rule: Rule;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function RuleItem({
  rule,
  index,
  total,
  onEdit,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors group ${
        rule.enabled
          ? 'bg-neutral-900/50 hover:bg-neutral-900'
          : 'bg-neutral-950 opacity-50'
      }`}
    >
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-neutral-600 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-neutral-600 hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Toggle */}
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-900 text-accent focus:ring-accent/50"
          checked={rule.enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
      </label>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-neutral-200 truncate">{rule.name}</span>
          <span className={`text-2xs px-1.5 py-0.5 rounded font-medium ${
            rule.action === 'direct'
              ? 'text-success-text'
              : 'text-neutral-500'
          }`}>
            {rule.action === 'proxy' ? t('rules.item.proxy') : t('rules.item.direct')}
          </span>
        </div>
        <code className="text-xs text-neutral-500 truncate block font-mono">{rule.pattern}</code>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-neutral-600 hover:text-neutral-300 rounded hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-neutral-600 hover:text-danger-text rounded hover:bg-danger-muted transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
