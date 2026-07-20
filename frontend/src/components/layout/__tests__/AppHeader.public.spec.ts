import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ name: 'PublicStatus', params: {}, meta: { title: 'Service Status' } })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}))

vi.mock('@/stores', () => ({
  useAppStore: () => ({
    contactInfo: '',
    docUrl: '',
    toggleMobileSidebar: vi.fn(),
    cachedPublicSettings: {}
  }),
  useAuthStore: () => ({
    user: null,
    isAdmin: false,
    isSimpleMode: false
  }),
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
  it('exposes model plaza, status, and configured source docs without the sidebar menu', async () => {
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

    expect(wrapper.get('a[href="/pricing"]').text()).toContain('Models & pricing')
    expect(wrapper.get('a[href="/status"]').text()).toContain('Status check')
    expect(wrapper.get('a[href="https://docs.example.com/"]').text()).toContain('nav.docs')
    expect(wrapper.find('button[aria-label="Toggle Menu"]').exists()).toBe(false)

    await wrapper.get('button[aria-label="Toggle Public Navigation"]').trigger('click')
    expect(wrapper.findAll('.header-public-menu-link')).toHaveLength(3)
  })
})
