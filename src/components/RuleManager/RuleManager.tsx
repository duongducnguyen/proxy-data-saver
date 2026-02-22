import React, { useState, useEffect } from 'react';
import { RuleEditor } from './RuleEditor';
import { RuleItem } from './RuleItem';
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
  rules: Rule[];
  loading: boolean;
  error: string | null;
  proxyRunning: boolean;
  onAddRule: (rule: Omit<Rule, 'id'>) => Promise<Rule>;
  onUpdateRule: (id: string, updates: Partial<Rule>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onReorderRules: (rules: Rule[]) => Promise<void>;
  onValidatePattern: (pattern: string) => Promise<{ valid: boolean; error?: string }>;
  onClearError: () => void;
}

export function RuleManager({
  rules,
  loading,
  error,
  proxyRunning,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onReorderRules,
  onValidatePattern,
  onClearError
}: Props) {
  const { t } = useTranslation();
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [editorValid, setEditorValid] = useState(false);

  // Close editor when proxy starts running
  useEffect(() => {
    if (proxyRunning) {
      setShowEditor(false);
      setEditingRule(null);
    }
  }, [proxyRunning]);

  const handleAddNew = () => {
    if (proxyRunning) return;
    setEditingRule(null);
    setEditorValid(false);
    setShowEditor(true);
  };

  const handleEdit = (rule: Rule) => {
    if (proxyRunning) return;
    setEditingRule(rule);
    setShowEditor(true);
  };

  const handleSave = async (ruleData: Omit<Rule, 'id'>) => {
    if (editingRule) {
      await onUpdateRule(editingRule.id, ruleData);
    } else {
      await onAddRule(ruleData);
    }
    setShowEditor(false);
    setEditingRule(null);
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingRule(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newRules = [...rules];
    [newRules[index - 1], newRules[index]] = [newRules[index], newRules[index - 1]];
    await onReorderRules(newRules);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= rules.length - 1) return;
    const newRules = [...rules];
    [newRules[index], newRules[index + 1]] = [newRules[index + 1], newRules[index]];
    await onReorderRules(newRules);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-neutral-500 dark:text-neutral-600 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('rules.title')}</h2>
        <div className="flex gap-2">
          {showEditor ? (
            <>
              <button type="button" onClick={handleCancel} className="btn btn-ghost">
                {t('rules.form.cancel')}
              </button>
              <button
                type="submit"
                form="rule-editor-form"
                className="btn btn-primary"
                disabled={!editorValid}
              >
                {editingRule ? t('rules.form.save') : t('rules.addRule')}
              </button>
            </>
          ) : (
            <button
              onClick={handleAddNew}
              className="btn btn-primary"
              disabled={proxyRunning}
              title={proxyRunning ? t('rules.disabledWhileRunning') : undefined}
            >
              {t('rules.addRule')}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">

        {/* Warning when proxy is running */}
        {proxyRunning && (
          <div className="flex-shrink-0 mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-yellow-700 dark:text-yellow-400 text-sm">{t('rules.disabledWhileRunning')}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex-shrink-0 mb-4 bg-danger-muted rounded-lg p-3 flex justify-between items-center">
            <span className="text-danger dark:text-danger-text text-sm">{error}</span>
            <button onClick={onClearError} className="text-danger dark:text-danger-text hover:text-red-600 dark:hover:text-red-300 text-sm">
              {t('rules.dismiss')}
            </button>
          </div>
        )}

        {/* Editor */}
        {showEditor && (
          <div className="flex-shrink-0 mb-4">
            <RuleEditor
              rule={editingRule}
              existingPriorities={rules.map((r) => r.priority)}
              onSave={handleSave}
              onCancel={handleCancel}
              onValidate={onValidatePattern}
              onValidChange={setEditorValid}
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-shrink-0 text-xs text-neutral-500 dark:text-neutral-600 mb-3">
          {t('rules.rulesInfo')}
        </div>

        {/* Rules List */}
        <div className="flex-1">
          {rules.length === 0 ? (
            <div className="text-center text-neutral-500 dark:text-neutral-600 py-12 text-sm">
              {t('rules.noRules')}
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  index={index}
                  total={rules.length}
                  disabled={proxyRunning}
                  onEdit={() => handleEdit(rule)}
                  onDelete={() => onDeleteRule(rule.id)}
                  onToggle={(enabled) => onUpdateRule(rule.id, { enabled })}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
