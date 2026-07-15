import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AuthLayout from '../AuthLayout.vue'

const appStore = vi.hoisted(() => ({
  cachedPublicSettings: null as { site_subtitle?: string } | null,
  siteName: 'QuotaJet',
  siteLogo: '/logo.png',
  publicSettingsLoaded: true,
  fetchPublicSettings: vi.fn(),
}))

vi.mock('@/stores', () => ({
  useAppStore: () => appStore,
}))

describe('AuthLayout brand fallbacks', () => {
  beforeEach(() => {
    appStore.cachedPublicSettings = null
    appStore.siteName = 'QuotaJet'
    appStore.siteLogo = '/logo.png'
    appStore.publicSettingsLoaded = true
    appStore.fetchPublicSettings.mockReset()
  })

  it('uses QuotaJet and the bundled logo when site settings are whitespace', () => {
    appStore.siteName = ' \t '
    appStore.siteLogo = ' \n '

    const wrapper = mount(AuthLayout)

    expect(wrapper.get('h1').text()).toBe('QuotaJet')
    expect(wrapper.get('img[alt="Logo"]').attributes('src')).toBe('/logo.png')

    wrapper.unmount()
  })
})
