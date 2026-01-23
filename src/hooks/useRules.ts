import { useState, useEffect, useCallback } from 'react';

interface Rule {
  id: string;
  name: string;
  pattern: string;
  action: 'proxy' | 'direct';
  enabled: boolean;
  priority: number;
}

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isElectron) {
      setLoading(false);
      return;
    }

    const loadRules = async () => {
      try {
        const rulesResult = await window.electronAPI.rules.get();
        setRules(rulesResult);
      } catch (err) {
        console.error('Failed to load rules:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  const addRule = useCallback(async (rule: Omit<Rule, 'id'>) => {
    if (!isElectron) throw new Error('Not in Electron');
    try {
      const newRule: Rule = {
        ...rule,
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      const updatedRules = await window.electronAPI.rules.add(newRule);
      setRules(updatedRules);
      return newRule;
    } catch (err) {
      setError(String(err));
      throw err;
    }
  }, []);

  const updateRule = useCallback(async (id: string, updates: Partial<Rule>) => {
    if (!isElectron) return;
    try {
      const updatedRules = await window.electronAPI.rules.update(id, updates);
      setRules(updatedRules);
    } catch (err) {
      setError(String(err));
      throw err;
    }
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    if (!isElectron) return;
    try {
      const updatedRules = await window.electronAPI.rules.delete(id);
      setRules(updatedRules);
    } catch (err) {
      setError(String(err));
      throw err;
    }
  }, []);

  const reorderRules = useCallback(async (reorderedRules: Rule[]) => {
    if (!isElectron) return;
    try {
      const withUpdatedPriority = reorderedRules.map((rule, index) => ({
        ...rule,
        priority: (index + 1) * 10
      }));
      const updatedRules = await window.electronAPI.rules.setAll(withUpdatedPriority);
      setRules(updatedRules);
    } catch (err) {
      setError(String(err));
      throw err;
    }
  }, []);

  const testRule = useCallback(async (pattern: string, hostname: string) => {
    if (!isElectron) return false;
    try {
      return await window.electronAPI.rules.test(pattern, hostname);
    } catch (err) {
      setError(String(err));
      return false;
    }
  }, []);

  const validatePattern = useCallback(async (pattern: string) => {
    if (!isElectron) return { valid: true };
    try {
      return await window.electronAPI.rules.validate(pattern);
    } catch (err) {
      return { valid: false, error: String(err) };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    rules,
    loading,
    error,
    addRule,
    updateRule,
    deleteRule,
    reorderRules,
    testRule,
    validatePattern,
    clearError
  };
}
