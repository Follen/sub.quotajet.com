export default {
  landing: {
    hero: {
      badge: '私密 AI 模型网关',
      titleLead: '私密入口。',
      titleHighlight: '不存内容。',
      description: '用一把 Key、一个 Base URL 接入 GPT、Claude、Gemini、DeepSeek、Qwen 等模型。QuotaJet 只做路由，不存储请求内容和响应内容。',
      primaryAction: '先创建一把 Key',
      secondaryAction: '查看模型和价格',
      metrics: {
        requests: '总请求数',
        users: '总用户数',
        uptime: '稳定运行时间'
      },
      visual: {
        input: '请求内容经过私密入口',
        storage: '只保留路由和用量',
        keys: 'KEYS',
        usage: 'USAGE',
        logs: 'NO CONTENT'
      }
    },
    sections: {
      privacy: {
        eyebrow: 'PRIVACY',
        title: '你的请求内容，不应该变成平台日志',
        description: 'QuotaJet 不存储请求内容和响应内容。工具统一走一个受控入口，减少 API Key 散落在 Agent、脚本和业务流程里的风险。',
        chips: {
          access: '受控入口',
          keys: '减少 Key 暴露',
          audit: '不存内容日志'
        },
        action: '进入控制台'
      },
      pricing: {
        eyebrow: 'PRICING',
        title: '别等调用失控后才看成本',
        description: '余额、用量、模型价格放在同一个控制台里。AI IDE、Agent、脚本和业务 API 高频调用时，也能及时知道钱花在哪里。',
        chips: {
          ratio: '3% 到 15%',
          transparent: '用量可见',
          control: '成本更好控制'
        },
        action: '查看价格'
      },
      stability: {
        eyebrow: 'RELIABILITY',
        title: '一条线路出问题，调用别停在原地',
        description: '线路选择、故障切换和用量可见性，帮 Agent、Bot、API 和个人项目扛住日常调用，而不是上游一抖就全部中断。',
        chips: {
          routes: '线路兜底',
          fast: '用量可见',
          dailyUse: '长期调用'
        },
        action: '打开控制台'
      },
      models: {
        eyebrow: 'ONE KEY',
        title: '换模型，不用每个工具都重配',
        description: '把工具统一指向一个 OpenAI 兼容 Base URL，就能从同一套配置调用 Claude、Gemini、DeepSeek、Qwen、Grok、GLM、Moonshot、Mistral 等模型。',
        chips: {
          oneKey: '一把 Key',
          multiModel: '一个 Base URL',
          migration: '切模型更快'
        },
        action: '开始接入'
      }
    },
    cta: {
      eyebrow: '先试一个',
      title: '先用一把 Key 跑通。',
      description: '把 Base URL 设置为 https://quotajet.com，先发一个小请求。确认能用，再慢慢迁移其他工具。',
      primaryAction: '创建 Key',
      secondaryAction: '查看接入指南'
    },
    visual: {
      status: '运行中',
      privacy: {
        label: '私密路由',
        server: {
          label: '服务地址',
          value: 'quotajet.com'
        },
        callback: {
          label: '回调域名',
          value: 'quotajet.com'
        },
        exposure: {
          label: 'Key 暴露',
          value: '更少'
        },
        content: {
          label: '内容日志',
          value: '不记录'
        },
        none: '不存储',
        input: '请求 + 响应',
        output: '路由 + 用量'
      },
      pricing: {
        label: '成本区间',
        official: '官方 API',
        quotajet: 'QuotaJet',
        visibility: '用量可见',
        clear: '清晰',
        caption: '路由成本更低，用量仍然可见。'
      },
      stability: {
        label: '调用状态',
        route: {
          label: '线路自动切换',
          value: '就绪'
        },
        response: {
          label: '响应不断流',
          value: '稳定'
        },
        daily: {
          label: '用量持续可见',
          value: '实时'
        }
      },
      models: {
        label: '统一配置',
        hub: '一把 Key'
      }
    },
    agents: {
      title: '直接接入你已经在用的工作流',
      description: '编程 Agent、AI IDE、聊天应用、自动化工具和本地模型客户端，都可以共用同一个 Base URL 和同一把 Key。'
    },
    nav: {
      models: '模型',
      docs: '文档',
      about: '关于',
      status: '状态',
      login: '登录',
      dashboard: '控制台'
    },
    footer: {
      agreement: '用户协议',
      privacy: '隐私政策',
      copyright: '保留所有权利。'
    }
  },
  batchImageGuide: {
    title: '图片批量生成',
    description: '一次提交多条提示词，任务完成后可统一下载图片结果'
  },
  // Home Page
  home: {
    viewOnGithub: '在 GitHub 上查看',
    viewDocs: '查看文档',
    docs: '文档',
    switchToLight: '切换到浅色模式',
    switchToDark: '切换到深色模式',
    dashboard: '控制台',
    login: '登录',
    getStarted: '立即开始',
    goToDashboard: '进入控制台',
    // 新增：面向用户的价值主张
    heroSubtitle: '一个密钥，畅用多个 AI 模型',
    heroDescription: '无需管理多个订阅账号，一站式接入 Claude、GPT、Gemini 等主流 AI 服务',
    tags: {
      subscriptionToApi: '订阅转 API',
      stickySession: '会话保持',
      realtimeBilling: '按量计费'
    },
    // 用户痛点区块
    painPoints: {
      title: '你是否也遇到这些问题？',
      items: {
        expensive: {
          title: '订阅费用高',
          desc: '每个 AI 服务都要单独订阅，每月支出越来越多'
        },
        complex: {
          title: '多账号难管理',
          desc: '不同平台的账号、密钥分散各处，管理起来很麻烦'
        },
        unstable: {
          title: '服务不稳定',
          desc: '单一账号容易触发限制，影响正常使用'
        },
        noControl: {
          title: '用量无法控制',
          desc: '不知道钱花在哪了，也无法限制团队成员的使用'
        }
      }
    },
    // 解决方案区块
    solutions: {
      title: '我们帮你解决',
      subtitle: '简单三步，开始省心使用 AI'
    },
    features: {
      unifiedGateway: '一键接入',
      unifiedGatewayDesc: '获取一个 API 密钥，即可调用所有已接入的 AI 模型，无需分别申请。',
      multiAccount: '稳定可靠',
      multiAccountDesc: '智能调度多个上游账号，自动切换和负载均衡，告别频繁报错。',
      balanceQuota: '用多少付多少',
      balanceQuotaDesc: '按实际使用量计费，支持设置配额上限，团队用量一目了然。'
    },
    // 优势对比
    comparison: {
      title: '为什么选择我们？',
      headers: {
        feature: '对比项',
        official: '官方订阅',
        us: '本平台'
      },
      items: {
        pricing: {
          feature: '付费方式',
          official: '固定月费，用不完也付',
          us: '按量付费，用多少付多少'
        },
        models: {
          feature: '模型选择',
          official: '单一服务商',
          us: '多模型随意切换'
        },
        management: {
          feature: '账号管理',
          official: '每个服务单独管理',
          us: '统一密钥，一站管理'
        },
        stability: {
          feature: '服务稳定性',
          official: '单账号易触发限制',
          us: '多账号池，自动切换'
        },
        control: {
          feature: '用量控制',
          official: '无法限制',
          us: '可设配额、查明细'
        }
      }
    },
    providers: {
      title: '已支持的 AI 模型',
      description: '一个 API，多种选择',
      supported: '已支持',
      soon: '即将推出',
      claude: 'Claude',
      gemini: 'Gemini',
      antigravity: 'Antigravity',
      more: '更多'
    },
    // CTA 区块
    cta: {
      title: '准备好开始了吗？',
      description: '注册即可获得免费试用额度，体验一站式 AI 服务',
      button: '免费注册'
    },
    footer: {
      allRightsReserved: '保留所有权利。'
    }
  },

  // Key Usage Query Page
  keyUsage: {
    title: 'API Key 用量查询',
    subtitle: '输入您的 API Key 以查看实时消费金额与使用状态',
    placeholder: 'sk-ant-mirror-xxxxxxxxxxxx',
    query: '查询',
    querying: '查询中...',
    privacyNote: '您的 Key 仅在浏览器本地处理，不会被存储',
    dateRange: '统计范围:',
    dateRangeToday: '今日',
    dateRange7d: '7 天',
    dateRange30d: '30 天',
    dateRange90d: '90 天',
    dateRangeCustom: '自定义',
    apply: '应用',
    used: '已使用',
    detailInfo: '详细信息',
    tokenStats: 'Token 统计',
    dailyDetail: '按日明细',
    modelStats: '模型用量统计',
    // Table headers
    date: '日期',
    model: '模型',
    requests: '请求数',
    inputTokens: '输入 Tokens',
    outputTokens: '输出 Tokens',
    cacheCreationTokens: '缓存创建',
    cacheReadTokens: '缓存读取',
    cacheWriteTokens: '缓存写入',
    totalTokens: '总 Tokens',
    cost: '费用',
    // Status
    quotaMode: 'Key 限额模式',
    walletBalance: '钱包余额',
    // Ring card titles
    totalQuota: '总额度',
    limit5h: '5 小时限额',
    limitDaily: '日限额',
    limit7d: '7 天限额',
    limitWeekly: '周限额',
    limitMonthly: '月限额',
    // Detail rows
    remainingQuota: '剩余额度',
    expiresAt: '过期时间',
    todayExpires: '(今日到期)',
    daysLeft: '({days} 天)',
    usedQuota: '已用额度',
    resetNow: '即将重置',
    subscriptionType: '订阅类型',
    subscriptionExpires: '订阅到期',
    // Usage stat cells
    todayRequests: '今日请求',
    todayInputTokens: '今日输入',
    todayOutputTokens: '今日输出',
    todayTokens: '今日 Tokens',
    todayCacheCreation: '今日缓存创建',
    todayCacheRead: '今日缓存读取',
    todayCost: '今日费用',
    rpmTpm: 'RPM / TPM',
    totalRequests: '累计请求',
    totalInputTokens: '累计输入',
    totalOutputTokens: '累计输出',
    totalTokensLabel: '累计 Tokens',
    totalCacheCreation: '累计缓存创建',
    totalCacheRead: '累计缓存读取',
    totalCost: '累计费用',
    avgDuration: '平均耗时',
    // Messages
    enterApiKey: '请输入 API Key',
    querySuccess: '查询成功',
    queryFailed: '查询失败',
    queryFailedRetry: '查询失败，请稍后重试',
    noDailyUsage: '暂无按日用量数据',
  },

  // Setup Wizard
  setup: {
    title: 'Sub2API 安装向导',
    description: '配置您的 Sub2API 实例',
    database: {
      title: '数据库配置',
      description: '连接到您的 PostgreSQL 数据库',
      host: '主机',
      port: '端口',
      username: '用户名',
      password: '密码',
      databaseName: '数据库名称',
      sslMode: 'SSL 模式',
      passwordPlaceholder: '密码',
      ssl: {
        disable: '禁用',
        require: '要求',
        verifyCa: '验证 CA',
        verifyFull: '完全验证'
      }
    },
    redis: {
      title: 'Redis 配置',
      description: '连接到您的 Redis 服务器',
      host: '主机',
      port: '端口',
      password: '密码（可选）',
      database: '数据库',
      passwordPlaceholder: '密码',
      enableTls: '启用 TLS',
      enableTlsHint: '连接 Redis 时使用 TLS（公共 CA 证书）'
    },
    admin: {
      title: '管理员账户',
      description: '创建您的管理员账户',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      passwordPlaceholder: '至少 8 个字符',
      confirmPasswordPlaceholder: '确认密码',
      passwordMismatch: '密码不匹配'
    },
    ready: {
      title: '准备安装',
      description: '检查您的配置并完成安装',
      database: '数据库',
      redis: 'Redis',
      adminEmail: '管理员邮箱'
    },
    status: {
      testing: '测试中...',
      success: '连接成功',
      testConnection: '测试连接',
      installing: '安装中...',
      completeInstallation: '完成安装',
      completed: '安装完成！',
      redirecting: '正在跳转到登录页面...',
      restarting: '服务正在重启，请稍候...',
      timeout: '服务重启时间超出预期，请手动刷新页面。'
    }
  },

  // Common
}
