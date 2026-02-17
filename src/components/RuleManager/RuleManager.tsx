import React, { useState } from 'react';
import { RuleEditor } from './RuleEditor';
import { RuleItem } from './RuleItem';
import { RuleTester } from './RuleTester';
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
  onAddRule: (rule: Omit<Rule, 'id'>) => Promise<Rule>;
  onUpdateRule: (id: string, updates: Partial<Rule>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onReorderRules: (rules: Rule[]) => Promise<void>;
  onTestRule: (pattern: string, hostname: string) => Promise<boolean>;
  onValidatePattern: (pattern: string) => Promise<{ valid: boolean; error?: string }>;
  onClearError: () => void;
}

export function RuleManager({
  rules,
  loading,
  error,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onReorderRules,
  onTestRule,
  onValidatePattern,
  onClearError
}: Props) {
  const { t } = useTranslation();
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [showTester, setShowTester] = useState(false);

  const handleAddNew = () => {
    setEditingRule(null);
    setShowEditor(true);
  };

  const handleEdit = (rule: Rule) => {
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
        <div className="text-neutral-600 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-100">{t('rules.title')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowTester(!showTester)} className="btn btn-ghost">
            {showTester ? t('rules.hideTester') : t('rules.testRules')}
          </button>
          <button onClick={handleAddNew} className="btn btn-primary">
            {t('rules.addRule')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 mb-4 bg-danger-muted rounded-lg p-3 flex justify-between items-center">
          <span className="text-danger-text text-sm">{error}</span>
          <button onClick={onClearError} className="text-danger-text hover:text-red-300 text-sm">
            {t('rules.dismiss')}
          </button>
        </div>
      )}

      {/* Tester */}
      {showTester && (
        <div className="flex-shrink-0 mb-4">
          <RuleTester onTest={onTestRule} rules={rules} />
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
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-shrink-0 text-xs text-neutral-600 mb-3">
        {t('rules.rulesInfo')}
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto">
        {rules.length === 0 ? (
          <div className="text-center text-neutral-600 py-12 text-sm">
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
  );
}
