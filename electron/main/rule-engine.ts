import wcmatch from 'wildcard-match';
import { Rule } from './types';

interface CompiledRule {
  rule: Rule;
  matchers: Array<(input: string) => boolean>;
}

export class RuleEngine {
  private compiledRules: CompiledRule[] = [];
  private defaultAction: 'proxy' | 'direct' = 'proxy';

  constructor() {}

  setDefaultAction(action: 'proxy' | 'direct'): void {
    this.defaultAction = action;
  }

  getDefaultAction(): 'proxy' | 'direct' {
    return this.defaultAction;
  }

  private compilePattern(pattern: string): Array<(input: string) => boolean> {
    // Support multiple patterns separated by comma
    const patterns = pattern.split(',').map(p => p.trim()).filter(p => p);
    return patterns.map(p => wcmatch(p, { separator: false }));
  }

  loadRules(rules: Rule[]): void {
    this.compiledRules = rules
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(rule => ({
        rule,
        matchers: this.compilePattern(rule.pattern)
      }));
  }

  match(hostname: string): { action: 'proxy' | 'direct'; matchedRule: Rule | null } {
    const normalizedHostname = hostname.toLowerCase();

    for (const { rule, matchers } of this.compiledRules) {
      // Match if ANY of the patterns match
      const isMatch = matchers.some(matcher => matcher(normalizedHostname));
      if (isMatch) {
        return { action: rule.action, matchedRule: rule };
      }
    }

    return { action: this.defaultAction, matchedRule: null };
  }

  testRule(pattern: string, hostname: string): boolean {
    try {
      const matchers = this.compilePattern(pattern);
      return matchers.some(matcher => matcher(hostname.toLowerCase()));
    } catch {
      return false;
    }
  }

  validatePattern(pattern: string): { valid: boolean; error?: string } {
    try {
      const patterns = pattern.split(',').map(p => p.trim()).filter(p => p);
      if (patterns.length === 0) {
        return { valid: false, error: 'Pattern cannot be empty' };
      }
      for (const p of patterns) {
        wcmatch(p, { separator: false });
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: String(e) };
    }
  }
}

export const ruleEngine = new RuleEngine();
