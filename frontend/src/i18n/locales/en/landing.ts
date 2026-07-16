export default {
  landing: {
    hero: {
      badge: 'PRIVATE AI MODEL GATEWAY',
      titleLead: 'Private gateway.',
      titleHighlight: 'No content logs.',
      description: 'Use one key and one Base URL for GPT, Claude, Gemini, DeepSeek, Qwen, and more. QuotaJet routes requests without storing request or response content.',
      primaryAction: 'Start with one key',
      secondaryAction: 'See models and pricing',
      metrics: {
        requests: 'Total requests',
        users: 'Total users',
        uptime: 'Stable uptime'
      },
      visual: {
        input: 'Request content passes through',
        storage: 'Only route and usage are kept',
        keys: 'KEYS',
        usage: 'USAGE',
        logs: 'NO CONTENT'
      }
    },
    sections: {
      privacy: {
        eyebrow: 'PRIVACY',
        title: 'Your request content should not become platform logs',
        description: 'QuotaJet does not store request or response content. Your tools send requests through one controlled gateway, so fewer API keys end up scattered across agents, scripts, and workflows.',
        chips: {
          access: 'Controlled gateway',
          keys: 'Less key exposure',
          audit: 'No content logs'
        },
        action: 'Open console'
      },
      pricing: {
        eyebrow: 'PRICING',
        title: 'See the cost before usage runs away',
        description: 'Balance, usage, and model pricing stay in one place, so high-frequency AI IDEs, agents, scripts, and business APIs are easier to watch before they get expensive.',
        chips: {
          ratio: '3% to 15%',
          transparent: 'Usage visible',
          control: 'Spend easier to control'
        },
        action: 'View pricing'
      },
      stability: {
        eyebrow: 'RELIABILITY',
        title: 'Keep model calls running when one route fails',
        description: 'Route selection, fallback, and usage visibility help agents, bots, APIs, and personal projects keep working through daily traffic instead of stopping at the first upstream issue.',
        chips: {
          routes: 'Route fallback',
          fast: 'Visible usage',
          dailyUse: 'Daily workloads'
        },
        action: 'Open console'
      },
      models: {
        eyebrow: 'ONE KEY',
        title: 'Switch models without rewiring every tool',
        description: 'Point your tools at one OpenAI-compatible Base URL, then call Claude, Gemini, DeepSeek, Qwen, Grok, GLM, Moonshot, Mistral, and more from the same setup.',
        chips: {
          oneKey: 'One key',
          multiModel: 'One Base URL',
          migration: 'Switch models faster'
        },
        action: 'Create a key'
      }
    },
    cta: {
      eyebrow: 'TRY IT FIRST',
      title: 'Start with one key.',
      description: 'Set the Base URL to https://quotajet.com, send one small request, and move more tools only after the first call works.',
      primaryAction: 'Create a key',
      secondaryAction: 'Setup guide'
    },
    visual: {
      status: 'active',
      privacy: {
        label: 'Private routing',
        server: {
          label: 'Server address',
          value: 'quotajet.com'
        },
        callback: {
          label: 'Callback domain',
          value: 'quotajet.com'
        },
        exposure: {
          label: 'Key exposure',
          value: 'reduced'
        },
        content: {
          label: 'Content logs',
          value: 'none'
        },
        none: 'not stored',
        input: 'request + response',
        output: 'route + usage'
      },
      pricing: {
        label: 'Cost range',
        official: 'Official API',
        quotajet: 'QuotaJet',
        visibility: 'Usage visibility',
        clear: 'clear',
        caption: 'Lower route costs, visible usage.'
      },
      stability: {
        label: 'Service state',
        route: {
          label: 'Auto route switch',
          value: 'ready'
        },
        response: {
          label: 'Response continuity',
          value: 'steady'
        },
        daily: {
          label: 'Usage visibility',
          value: 'live'
        }
      },
      models: {
        label: 'Unified config',
        hub: 'One key'
      }
    },
    agents: {
      title: 'Works with the tools already in your workflow',
      description: 'Use the same Base URL and key across coding agents, AI IDEs, chat apps, automation tools, and local model clients.'
    },
    nav: {
      models: 'Models',
      docs: 'Docs',
      about: 'About',
      status: 'Status',
      login: 'Sign in',
      dashboard: 'Console'
    },
    footer: {
      agreement: 'User Agreement',
      privacy: 'Privacy Policy',
      copyright: 'All rights reserved.'
    }
  },
  batchImageGuide: {
    title: 'Batch Image Generation',
    description: 'Submit multiple prompts in one job and download the generated images when complete'
  },
  // Home Page
  home: {
    viewOnGithub: 'View on GitHub',
    viewDocs: 'View Documentation',
    docs: 'Docs',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    dashboard: 'Dashboard',
    login: 'Login',
    getStarted: 'Get Started',
    goToDashboard: 'Go to Dashboard',
    // User-focused value proposition
    heroSubtitle: 'One Key, All AI Models',
    heroDescription: 'No need to manage multiple subscriptions. Access Claude, GPT, Gemini and more with a single API key',
    tags: {
      subscriptionToApi: 'Subscription to API',
      stickySession: 'Session Persistence',
      realtimeBilling: 'Pay As You Go'
    },
    // Pain points section
    painPoints: {
      title: 'Sound Familiar?',
      items: {
        expensive: {
          title: 'High Subscription Costs',
          desc: 'Paying for multiple AI subscriptions that add up every month'
        },
        complex: {
          title: 'Account Chaos',
          desc: 'Managing scattered accounts and API keys across different platforms'
        },
        unstable: {
          title: 'Service Interruptions',
          desc: 'Single accounts hitting rate limits and disrupting your workflow'
        },
        noControl: {
          title: 'No Usage Control',
          desc: "Can't track where your money goes or limit team member usage"
        }
      }
    },
    // Solutions section
    solutions: {
      title: 'We Solve These Problems',
      subtitle: 'Three simple steps to stress-free AI access'
    },
    features: {
      unifiedGateway: 'One-Click Access',
      unifiedGatewayDesc: 'Get a single API key to call all connected AI models. No separate applications needed.',
      multiAccount: 'Always Reliable',
      multiAccountDesc: 'Smart routing across multiple upstream accounts with automatic failover. Say goodbye to errors.',
      balanceQuota: 'Pay What You Use',
      balanceQuotaDesc: 'Usage-based billing with quota limits. Full visibility into team consumption.'
    },
    // Comparison section
    comparison: {
      title: 'Why Choose Us?',
      headers: {
        feature: 'Comparison',
        official: 'Official Subscriptions',
        us: 'Our Platform'
      },
      items: {
        pricing: {
          feature: 'Pricing',
          official: 'Fixed monthly fee, pay even if unused',
          us: 'Pay only for what you use'
        },
        models: {
          feature: 'Model Selection',
          official: 'Single provider only',
          us: 'Switch between models freely'
        },
        management: {
          feature: 'Account Management',
          official: 'Manage each service separately',
          us: 'Unified key, one dashboard'
        },
        stability: {
          feature: 'Stability',
          official: 'Single account rate limits',
          us: 'Multi-account pool, auto-failover'
        },
        control: {
          feature: 'Usage Control',
          official: 'Not available',
          us: 'Quotas & detailed analytics'
        }
      }
    },
    providers: {
      title: 'Supported AI Models',
      description: 'One API, Multiple Choices',
      supported: 'Supported',
      soon: 'Soon',
      claude: 'Claude',
      gemini: 'Gemini',
      antigravity: 'Antigravity',
      more: 'More'
    },
    // CTA section
    cta: {
      title: 'Ready to Get Started?',
      description: 'Sign up now and get free trial credits to experience seamless AI access',
      button: 'Sign Up Free'
    },
    footer: {
      allRightsReserved: 'All rights reserved.'
    }
  },

  // Key Usage Query Page
  keyUsage: {
    title: 'API Key Usage',
    subtitle: 'Enter your API Key to view real-time spending and usage status',
    placeholder: 'sk-ant-mirror-xxxxxxxxxxxx',
    query: 'Query',
    querying: 'Querying...',
    privacyNote: 'Your Key is processed locally in the browser and will not be stored',
    dateRange: 'Date Range:',
    dateRangeToday: 'Today',
    dateRange7d: '7 Days',
    dateRange30d: '30 Days',
    dateRange90d: '90 Days',
    dateRangeCustom: 'Custom',
    apply: 'Apply',
    used: 'Used',
    detailInfo: 'Detail Information',
    tokenStats: 'Token Statistics',
    dailyDetail: 'Daily Detail',
    modelStats: 'Model Usage Statistics',
    // Table headers
    date: 'Date',
    model: 'Model',
    requests: 'Requests',
    inputTokens: 'Input Tokens',
    outputTokens: 'Output Tokens',
    cacheCreationTokens: 'Cache Creation',
    cacheReadTokens: 'Cache Read',
    cacheWriteTokens: 'Cache Write',
    totalTokens: 'Total Tokens',
    cost: 'Cost',
    // Status
    quotaMode: 'Key Quota Mode',
    walletBalance: 'Wallet Balance',
    // Ring card titles
    totalQuota: 'Total Quota',
    limit5h: '5-Hour Limit',
    limitDaily: 'Daily Limit',
    limit7d: '7-Day Limit',
    limitWeekly: 'Weekly Limit',
    limitMonthly: 'Monthly Limit',
    // Detail rows
    remainingQuota: 'Remaining Quota',
    expiresAt: 'Expires At',
    todayExpires: '(expires today)',
    daysLeft: '({days} days)',
    usedQuota: 'Used Quota',
    resetNow: 'Resetting soon',
    subscriptionType: 'Subscription Type',
    subscriptionExpires: 'Subscription Expires',
    // Usage stat cells
    todayRequests: 'Today Requests',
    todayInputTokens: 'Today Input',
    todayOutputTokens: 'Today Output',
    todayTokens: 'Today Tokens',
    todayCacheCreation: 'Today Cache Creation',
    todayCacheRead: 'Today Cache Read',
    todayCost: 'Today Cost',
    rpmTpm: 'RPM / TPM',
    totalRequests: 'Total Requests',
    totalInputTokens: 'Total Input',
    totalOutputTokens: 'Total Output',
    totalTokensLabel: 'Total Tokens',
    totalCacheCreation: 'Total Cache Creation',
    totalCacheRead: 'Total Cache Read',
    totalCost: 'Total Cost',
    avgDuration: 'Avg Duration',
    // Messages
    enterApiKey: 'Please enter an API Key',
    querySuccess: 'Query successful',
    queryFailed: 'Query failed',
    queryFailedRetry: 'Query failed, please try again later',
    noDailyUsage: 'No daily usage data',
  },

  // Setup Wizard
  setup: {
    title: 'Sub2API Setup',
    description: 'Configure your Sub2API instance',
    database: {
      title: 'Database Configuration',
      description: 'Connect to your PostgreSQL database',
      host: 'Host',
      port: 'Port',
      username: 'Username',
      password: 'Password',
      databaseName: 'Database Name',
      sslMode: 'SSL Mode',
      passwordPlaceholder: 'Password',
      ssl: {
        disable: 'Disable',
        require: 'Require',
        verifyCa: 'Verify CA',
        verifyFull: 'Verify Full'
      }
    },
    redis: {
      title: 'Redis Configuration',
      description: 'Connect to your Redis server',
      host: 'Host',
      port: 'Port',
      password: 'Password (optional)',
      database: 'Database',
      passwordPlaceholder: 'Password',
      enableTls: 'Enable TLS',
      enableTlsHint: 'Use TLS when connecting to Redis (public CA certs)'
    },
    admin: {
      title: 'Admin Account',
      description: 'Create your administrator account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      passwordPlaceholder: 'Min 8 characters',
      confirmPasswordPlaceholder: 'Confirm password',
      passwordMismatch: 'Passwords do not match'
    },
    ready: {
      title: 'Ready to Install',
      description: 'Review your configuration and complete setup',
      database: 'Database',
      redis: 'Redis',
      adminEmail: 'Admin Email'
    },
    status: {
      testing: 'Testing...',
      success: 'Connection Successful',
      testConnection: 'Test Connection',
      installing: 'Installing...',
      completeInstallation: 'Complete Installation',
      completed: 'Installation completed!',
      redirecting: 'Redirecting to login page...',
      restarting: 'Service is restarting, please wait...',
      timeout: 'Service restart is taking longer than expected. Please refresh the page manually.'
    }
  },

  // Common
}
