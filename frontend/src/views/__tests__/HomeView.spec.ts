import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HomeView from '../HomeView.vue'

const { appStore, authStore } = vi.hoisted(() => ({
  appStore: {
    cachedPublicSettings: null as { site_name?: string; site_logo?: string; home_content?: string } | null,
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
    useI18n: () => ({ t: (key: string) => key }),
  }
})

vi.mock('@/stores', () => ({
  useAppStore: () => appStore,
  useAuthStore: () => authStore,
}))

describe('HomeView brand fallbacks', () => {
  beforeEach(() => {
    appStore.cachedPublicSettings = null
    appStore.siteName = 'QuotaJet'
    appStore.siteLogo = '/logo.png'
    appStore.publicSettingsLoaded = true
    authStore.checkAuth.mockReset()

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })
  })

  it('uses QuotaJet and the bundled logo when cached and store values are whitespace', () => {
    appStore.cachedPublicSettings = { site_name: ' \t ', site_logo: ' \n ', home_content: '' }
    appStore.siteName = '  '
    appStore.siteLogo = '\t'

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          LocaleSwitcher: true,
          Icon: true,
        },
      },
    })

    expect(wrapper.get('h1').text()).toBe('QuotaJet')
    expect(wrapper.get('img[alt="Logo"]').attributes('src')).toBe('/logo.png')

    wrapper.unmount()
  })
})
