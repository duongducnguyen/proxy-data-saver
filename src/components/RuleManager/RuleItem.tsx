import React from 'react';

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
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
        rule.enabled
          ? 'bg-gray-900 border-gray-700'
          : 'bg-gray-900/50 border-gray-800 opacity-60'
      }`}
    >
      <div className="flex flex-col gap-1">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          checked={rule.enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
      </label>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{rule.name}</span>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              rule.action === 'proxy'
                ? 'bg-blue-900 text-blue-300'
                : 'bg-green-900 text-green-300'
            }`}
          >
            {rule.action === 'proxy' ? 'Proxy' : 'Direct'}
          </span>
        </div>
        <code className="text-sm text-gray-400 truncate block">{rule.pattern}</code>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
