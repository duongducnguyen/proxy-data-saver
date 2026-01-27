import Store from 'electron-store';
import { AppConfig, ProxyConfig, Rule, DEFAULT_CONFIG } from './types';

interface StoreSchema {
  proxyConfig: ProxyConfig;
  rules: Rule[];
}

class ConfigStore {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'proxy-data-saver-config',
      defaults: {
        proxyConfig: DEFAULT_CONFIG.proxyConfig,
        rules: DEFAULT_CONFIG.rules
      }
    });
  }

  getProxyConfig(): ProxyConfig {
    return this.store.get('proxyConfig');
  }

  setProxyConfig(config: Partial<ProxyConfig>): ProxyConfig {
    const current = this.getProxyConfig();
    const updated = { ...current, ...config };
    this.store.set('proxyConfig', updated);
    return updated;
  }

  getRules(): Rule[] {
    return this.store.get('rules');
  }

  setRules(rules: Rule[]): void {
    this.store.set('rules', rules);
  }

  addRule(rule: Rule): Rule[] {
    const rules = this.getRules();
    rules.push(rule);
    rules.sort((a, b) => a.priority - b.priority);
    this.setRules(rules);
    return rules;
  }

  updateRule(id: string, updates: Partial<Rule>): Rule[] {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === id);
    if (index !== -1) {
      rules[index] = { ...rules[index], ...updates };
      rules.sort((a, b) => a.priority - b.priority);
      this.setRules(rules);
    }
    return rules;
  }

  deleteRule(id: string): Rule[] {
    const rules = this.getRules().filter(r => r.id !== id);
    this.setRules(rules);
    return rules;
  }

  getFullConfig(): AppConfig {
    return {
      proxyConfig: this.getProxyConfig(),
      rules: this.getRules()
    };
  }

  exportConfig(): string {
    return JSON.stringify(this.getFullConfig(), null, 2);
  }

  importConfig(jsonString: string): AppConfig {
    const config = JSON.parse(jsonString) as AppConfig;
    this.store.set('proxyConfig', config.proxyConfig);
    this.store.set('rules', config.rules);
    return config;
  }

  resetToDefaults(): AppConfig {
    this.store.set('proxyConfig', DEFAULT_CONFIG.proxyConfig);
    this.store.set('rules', DEFAULT_CONFIG.rules);
    return DEFAULT_CONFIG;
  }
}

export const configStore = new ConfigStore();
