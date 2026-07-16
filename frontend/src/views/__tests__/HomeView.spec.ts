import { mount, type VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import enLocale from '@/i18n/locales/en/landing'
import zhLocale from '@/i18n/locales/zh/landing'
import HomeView from '../HomeView.vue'

type PublicSettings = {
  site_name?: string
  site_logo?: string
  doc_url?: string
  home_content?: string
  login_agreement_documents?: Array<{
    id: string
    title: string
    content_md: string
  }>
}

const { appStore, authStore } = vi.hoisted(() => ({
  appStore: {
    cachedPublicSettings: null as PublicSettings | null,
    siteName: 'QuotaJet',
    siteLogo: '/logo.png',
    docUrl: '',
    publicSettingsLoaded: true,
    fetchPublicSettings: vi.fn(),
  },
  authStore: {
    isAuthenticated: false,
    isAdmin: false,
    user: null as { email?: string } | null,
    checkAuth: vi.fn(),
  },
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ locale: ref('en'), t: (key: string) => key }),
  }
})

vi.mock('@/api/landing', () => ({
  getLandingMetrics: vi.fn().mockResolvedValue({
    total_requests: 48219037,
    total_users: 18287,
    stable_uptime_seconds: 8553900,
    generated_at: 0,
  }),
}))

vi.mock('@/stores', () => ({
  useAppStore: () => appStore,
  useAuthStore: () => authStore,
}))

const wrappers: VueWrapper[] = []

function mountHome() {
  const wrapper = mount(HomeView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template:
            '<a :data-to="to" :href="typeof to === `string` ? to : undefined"><slot /></a>',
        },
        LocaleSwitcher: true,
        AnnouncementBell: true,
        RelayMachineVisual: { template: '<canvas class="landing-metal-canvas" />' },
      },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('HomeView', () => {
  beforeEach(() => {
    appStore.cachedPublicSettings = null
    appStore.siteName = 'QuotaJet'
    appStore.siteLogo = '/logo.png'
    appStore.docUrl = ''
    appStore.publicSettingsLoaded = true
    appStore.fetchPublicSettings.mockReset()
    authStore.isAuthenticated = false
    authStore.isAdmin = false
    authStore.user = null
    authStore.checkAuth.mockReset()
    document.body.style.overflow = ''
    document.documentElement.classList.remove('dark')
    localStorage.clear()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })
  })

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    document.body.style.overflow = ''
  })

  it('renders the full default homepage in approved order', () => {
    const wrapper = mountHome()

    expect(
      wrapper
        .findAll('[data-home-section]')
        .map((node) => node.attributes('data-home-section')),
    ).toEqual(['hero', 'privacy', 'models', 'pricing', 'reliability', 'tools', 'cta'])
    expect(wrapper.find('[data-home-header]').exists()).toBe(true)
    expect(wrapper.find('[data-home-footer]').exists()).toBe(true)
  })

  it('omits unsafe or missing docs URLs', () => {
    appStore.cachedPublicSettings = { doc_url: 'javascript:alert(1)', home_content: '' }

    expect(mountHome().find('[data-doc-link]').exists()).toBe(false)
  })

  it('only renders Privacy Policy when the document exists', () => {
    appStore.cachedPublicSettings = {
      login_agreement_documents: [{ id: 'terms', title: 'Terms', content_md: '' }],
      home_content: '',
    }
    expect(mountHome().find('a[href="/legal/privacy"]').exists()).toBe(false)

    appStore.cachedPublicSettings.login_agreement_documents?.push({
      id: 'privacy',
      title: 'Privacy',
      content_md: '',
    })
    expect(mountHome().find('a[href="/legal/privacy"]').exists()).toBe(true)
  })

  it('opens and closes the mobile navigation without leaving body scroll locked', async () => {
    const wrapper = mountHome()

    await wrapper.get('[data-mobile-menu-button]').trigger('click')
    expect(wrapper.get('[data-mobile-navigation]').attributes('data-open')).toBe('true')
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.get('[data-mobile-navigation] a[href="#models"]').trigger('click')
    expect(wrapper.get('[data-mobile-navigation]').attributes('data-open')).toBe('false')
    expect(document.body.style.overflow).toBe('')

    await wrapper.get('[data-mobile-menu-button]').trigger('click')
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('switches the header to compact mode after scrolling', async () => {
    const wrapper = mountHome()

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 21 })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-home-header]').attributes('data-compact')).toBe('true')
  })

  it('uses the document class as theme truth and persists changes', async () => {
    document.documentElement.classList.add('dark')
    const wrapper = mountHome()

    await wrapper.get('[data-theme-button]').trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('renders announcements only for authenticated visitors', () => {
    expect(mountHome().find('announcement-bell-stub').exists()).toBe(false)

    authStore.isAuthenticated = true
    expect(mountHome().find('announcement-bell-stub').exists()).toBe(true)
    expect(mountHome().find('a[href="/dashboard"]').exists()).toBe(true)
  })

  it('keeps Status external and emits safe Docs links only', () => {
    appStore.cachedPublicSettings = {
      doc_url: ' https://docs.example.com/guide ',
      home_content: '',
    }
    const wrapper = mountHome()
    const status = wrapper.get('a[href="https://status.quotajet.com/"]')

    expect(status.attributes('target')).toBe('_blank')
    expect(status.attributes('rel')).toBe('noopener noreferrer')
    expect(wrapper.get('[data-doc-link]').attributes('href')).toBe(
      'https://docs.example.com/guide',
    )
  })

  it('preserves custom home HTML instead of mounting the default homepage', () => {
    appStore.cachedPublicSettings = { home_content: '<strong>Custom</strong>' }
    const wrapper = mountHome()

    expect(wrapper.html()).toContain('<strong>Custom</strong>')
    expect(wrapper.find('[data-home-section]').exists()).toBe(false)
  })

  it('preserves custom home URLs in the full-page iframe branch', () => {
    appStore.cachedPublicSettings = { home_content: ' https://example.com/custom ' }
    const wrapper = mountHome()

    expect(wrapper.get('iframe').attributes('src')).toBe('https://example.com/custom')
    expect(wrapper.find('[data-home-section]').exists()).toBe(false)
  })

  it('uses the required QuotaJet brand when legacy settings are whitespace', () => {
    appStore.cachedPublicSettings = {
      site_name: ' \t ',
      site_logo: ' \n ',
      home_content: '',
    }
    appStore.siteName = '  '
    appStore.siteLogo = '\t'

    const wrapper = mountHome()

    expect(wrapper.get('[data-home-brand]').text()).toBe('QuotaJet')
    expect(wrapper.get('[data-home-logo]').attributes('src')).toBe('/logo.png')
  })

  it('provides the exact shell translations in English and Chinese', () => {
    expect(enLocale.landing.nav).toEqual({
      models: 'Models',
      docs: 'Docs',
      about: 'About',
      status: 'Status',
      login: 'Sign in',
      dashboard: 'Console',
    })
    expect(enLocale.landing.footer).toEqual({
      agreement: 'User Agreement',
      privacy: 'Privacy Policy',
      copyright: 'All rights reserved.',
    })
    expect(zhLocale.landing.nav).toEqual({
      models: '模型',
      docs: '文档',
      about: '关于',
      status: '状态',
      login: '登录',
      dashboard: '控制台',
    })
    expect(zhLocale.landing.footer).toEqual({
      agreement: '用户协议',
      privacy: '隐私政策',
      copyright: '保留所有权利。',
    })
  })
})
