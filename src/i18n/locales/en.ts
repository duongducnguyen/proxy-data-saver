export const en = {
  app: {
    title: 'Proxy Data Saver',
    status: {
      running: 'Running',
      stopped: 'Stopped'
    },
    checking: 'Checking'
  },
  firewall: {
    title: 'Firewall Permission Required',
    description: 'This app needs Windows Firewall permission to allow devices on your network (phones, laptops) to connect through the proxy.',
    requestPermission: 'Grant Firewall Permission',
    checkAgain: 'Check Again',
    hint: 'Click the button above to grant permission. A Windows UAC prompt will appear asking for administrator access.'
  },
  tabs: {
    dashboard: 'Dashboard',
    proxy: 'Proxy',
    rules: 'Rules',
    traffic: 'Traffic'
  },
  footer: {
    lan: 'LAN',
    proxies: 'Proxies',
    rules: 'Rules',
    active: 'active'
  },
  proxy: {
    title: 'Proxy List',
    titleActive: 'Active Proxies',
    status: {
      running: 'Running',
      stopped: 'Stopped',
      ok: 'OK',
      failed: 'Failed'
    },
    proxyCount: 'proxy(s)',
    placeholder: `Enter proxies, one per line:
username:password:hostname:port

Examples:
user1:pass1:sg-pr.lunaproxy.net:23501
user2:pass2:us-pr.lunaproxy.net:23502

Or without auth:
hostname:port`,
    formatHint: 'Format: username:password:host:port or host:port',
    settings: {
      startPort: 'Start Port',
      portsRange: 'Ports',
      defaultAction: 'Default Action',
      useProxy: 'Use Proxy',
      directConnection: 'Direct Connection',
      whenNoRule: 'When no rule matches',
      autoStart: 'Auto-start on launch'
    },
    actions: {
      save: 'Save',
      discard: 'Discard',
      start: 'Start',
      stop: 'Stop All',
      restart: 'Restart All',
      starting: 'Starting...',
      stopping: 'Stopping...',
      restarting: 'Restarting...',
      copy: 'Copy',
      copyAll: 'Copy All'
    },
    table: {
      localPort: 'Local Port',
      upstream: 'Upstream Proxy',
      status: 'Status',
      lanAddress: 'LAN Address'
    },
    hints: {
      configureDevices: 'Configure your devices to use these addresses as HTTP proxy.',
      yourLanIp: 'Your LAN IP',
      saveBeforeStart: 'Save or discard changes before starting'
    },
    dismiss: 'Dismiss'
  },
  rules: {
    title: 'Routing Rules',
    testRules: 'Test Rules',
    hideTester: 'Hide Tester',
    addRule: 'Add Rule',
    editRule: 'Edit Rule',
    noRules: 'No rules configured. Add a rule to get started.',
    rulesInfo: 'Rules are evaluated in order. First matching rule wins.',
    form: {
      name: 'Name',
      namePlaceholder: 'e.g., Block Ads',
      pattern: 'Pattern',
      patternPlaceholder: `Enter patterns, one per line:
*.google.com
*.youtube.com
*.facebook.com`,
      patternHint: 'Use * as wildcard. One pattern per line.',
      action: 'Action',
      useProxy: 'Use Proxy',
      directConnection: 'Direct Connection',
      priority: 'Priority',
      priorityHint: 'Lower number = higher priority',
      enabled: 'Enabled',
      save: 'Save Rule',
      cancel: 'Cancel',
      validating: 'Validating...',
      patternValid: 'Pattern is valid',
      patternInvalid: 'Invalid pattern'
    },
    tester: {
      title: 'Rule Tester',
      hostname: 'Test Hostname',
      hostnamePlaceholder: 'e.g., www.google.com',
      test: 'Test',
      testing: 'Testing...',
      result: 'Result',
      matchedRule: 'Matched Rule',
      noMatch: 'No rule matched (using default action)',
      action: {
        proxy: 'Use Proxy',
        direct: 'Direct Connection'
      }
    },
    item: {
      enabled: 'Enabled',
      disabled: 'Disabled',
      proxy: 'Proxy',
      direct: 'Direct',
      edit: 'Edit',
      delete: 'Delete',
      moveUp: 'Move Up',
      moveDown: 'Move Down',
      confirmDelete: 'Are you sure you want to delete this rule?'
    },
    dismiss: 'Dismiss'
  },
  traffic: {
    title: 'Traffic Monitor',
    pause: 'Pause',
    resume: 'Resume',
    clear: 'Clear',
    stats: {
      total: 'Total',
      proxy: 'Proxy',
      direct: 'Direct',
      hosts: 'Hosts'
    },
    filter: {
      placeholder: 'Filter by hostname...',
      all: 'All',
      proxy: 'Proxy',
      direct: 'Direct',
      allProxies: 'All Proxies',
      proxyPort: 'Port {port}'
    },
    paused: 'Traffic monitoring is paused. Click Resume to continue.',
    table: {
      time: 'Time',
      method: 'Method',
      hostname: 'SNI / Hostname',
      action: 'Action',
      rule: 'Rule'
    },
    noTraffic: 'No traffic yet. Start the proxy and make some requests.',
    noMatch: 'No matching traffic found.',
    showing: 'Showing {count} of {total} entries'
  },
  dashboard: {
    title: 'Dashboard',
    filter: {
      allProxies: 'All Proxies'
    },
    period: {
      today: 'Today',
      week: 'Week',
      month: 'Month',
      all: 'All Time'
    },
    stats: {
      totalData: 'Total Data',
      proxyData: 'Proxy Data',
      directData: 'Direct Data',
      savings: 'Savings',
      requests: 'Requests'
    },
    topDomains: {
      title: 'Top Domains',
      domain: 'Domain',
      bytes: 'Data',
      requests: 'Requests',
      action: 'Action',
      noData: 'No data yet'
    },
    chart: {
      proxy: 'Via Proxy',
      direct: 'Direct'
    },
    actions: {
      reset: 'Reset Stats',
      confirmReset: 'Are you sure you want to reset all statistics? This cannot be undone.',
      refresh: 'Refresh'
    },
    noData: 'No data recorded yet. Start the proxy and browse to see statistics.'
  },
  language: {
    en: 'English',
    vi: 'Tiếng Việt'
  }
};
