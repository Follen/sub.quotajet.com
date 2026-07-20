import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const { appStoreState, authStoreState } = vi.hoisted(() => ({
  appStoreState: {
    contactInfo: '',
    docUrl: '',
    toggleMobileSidebar: vi.fn(),
    cachedPublicSettings: {},
  },
  authStoreState: {
    user: null as { username: string; email: string; role: string; balance: number; frozen_balance: number } | null,
    isAdmin: false,
    isSimpleMode: false,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ name: 'PublicStatus', params: {}, meta: { title: 'Service Status' } })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      'landing.nav.publicNavigation': 'Public navigation',
      'landing.nav.openNavigation': 'Open public navigation',
      'landing.nav.about': 'About',
    }[key] || key)
  })
}))

vi.mock('@/stores', () => ({
  useAppStore: () => appStoreState,
  useAuthStore: () => authStoreState,
  useOnboardingStore: () => ({ replay: vi.fn() })
}))

vi.mock('@/stores/adminSettings', () => ({
  useAdminSettingsStore: () => ({ customMenuItems: [] })
}))

vi.mock('@/components/common/LocaleSwitcher.vue', () => ({
  default: { name: 'LocaleSwitcher', template: '<button data-locale />' }
}))

vi.mock('@/components/common/SubscriptionProgressMini.vue', () => ({
  default: { name: 'SubscriptionProgressMini', template: '<div data-subscriptions />' }
}))

vi.mock('@/components/common/AnnouncementBell.vue', () => ({
  default: { name: 'AnnouncementBell', template: '<div data-announcements />' }
}))

vi.mock('@/components/icons/Icon.vue', () => ({
  default: { name: 'Icon', template: '<span data-icon />' }
}))

import AppHeader from '../AppHeader.vue'

describe('AppHeader public mode', () => {
  it('preserves the public catalog navigation and login action on desktop and mobile', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        publicPage: true,
        publicDocUrl: 'https://docs.example.com/'
      },
      global: {
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          }
        }
      }
    })

    expect(wrapper.get('a[href="/home"]').text()).toContain('Home')
    expect(wrapper.get('a[href="/dashboard"]').text()).toContain('Console')
    expect(wrapper.get('a[href="/pricing"]').text()).toContain('Models')
    expect(wrapper.get('a[href="/status"]').text()).toContain('Status check')
    expect(wrapper.get('a[href="/home#privacy"]').text()).toContain('About')
    expect(wrapper.get('a[href="https://docs.example.com/"]').text()).toContain('nav.docs')
    expect(wrapper.get('a[href="/login"]').text()).toContain('landing.nav.login')
    expect(wrapper.get('a[href="/login"]').classes()).toContain('hidden')
    expect(wrapper.get('nav[aria-label="Public navigation"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Toggle Menu"]').exists()).toBe(false)

    await wrapper.get('button[aria-label="Open public navigation"]').trigger('click')
    expect(wrapper.findAll('.header-public-menu-link').map((link) => link.attributes('href'))).toEqual([
      '/home',
      '/dashboard',
      '/pricing',
      '/status',
      '/home#privacy',
      'https://docs.example.com/',
      '/login',
    ])
  })

  it('keeps authenticated account controls while exposing the public catalog', () => {
    authStoreState.user = {
      username: 'Ada',
      email: 'ada@example.com',
      role: 'user',
      balance: 12,
      frozen_balance: 0,
    }
    const wrapper = mount(AppHeader, {
      props: { publicPage: true },
      global: {
        stubs: {
          'router-link': {
            props: ['to'],
            template: '<a :href="to"><slot /></a>'
          }
        }
      }
    })

    expect(wrapper.get('button[aria-label="User Menu"]').text()).toContain('Ada')
    expect(wrapper.get('a[href="/home"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/login"]').exists()).toBe(false)

    authStoreState.user = null
  })
})
