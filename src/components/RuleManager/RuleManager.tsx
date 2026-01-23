import React, { useState } from 'react';
import { RuleEditor } from './RuleEditor';
import { RuleItem } from './RuleItem';
import { RuleTester } from './RuleTester';

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
      <div className="card">
        <div className="text-center text-gray-400 py-8">Loading rules...</div>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Routing Rules</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowTester(!showTester)} className="btn btn-secondary">
            {showTester ? 'Hide Tester' : 'Test Rules'}
          </button>
          <button onClick={handleAddNew} className="btn btn-primary">
            Add Rule
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex justify-between items-center">
          <span className="text-red-300">{error}</span>
          <button onClick={onClearError} className="text-red-400 hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {showTester && (
        <RuleTester onTest={onTestRule} rules={rules} />
      )}

      {showEditor && (
        <RuleEditor
          rule={editingRule}
          existingPriorities={rules.map((r) => r.priority)}
          onSave={handleSave}
          onCancel={handleCancel}
          onValidate={onValidatePattern}
        />
      )}

      <div className="text-sm text-gray-500 mb-2">
        Rules are evaluated in order. First matching rule wins.
      </div>

      {rules.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-gray-900 rounded-lg">
          No rules configured. Add a rule to get started.
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
  );
}
