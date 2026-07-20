import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/components/layout/AppHeader.vue', () => ({
  default: { name: 'AppHeader', template: '<header data-app-header />' },
}))

vi.mock('@/api/pricing', () => ({
  getPricing: vi.fn().mockResolvedValue({ version: 'v1', generated_at: '', platforms: [] }),
}))

vi.mock('@/stores', () => ({
  useAppStore: () => ({ apiBaseUrl: '', cachedPublicSettings: {}, docUrl: '' }),
  useAuthStore: () => ({ isAuthenticated: false }),
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copied: { value: false }, copyToClipboard: vi.fn() }),
}))

import PricingView from '../PricingView.vue'

describe('PricingView', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders as a standalone public page without the application sidebar shell', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/pricing', component: PricingView }],
    })

    const wrapper = mount(PricingView, {
      global: {
        plugins: [router],
        stubs: { AppHeader: true, PricingShell: true },
      },
    })

    expect(wrapper.get('.qj-landing').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'AppHeader' }).exists()).toBe(true)
    expect(wrapper.find('.sidebar').exists()).toBe(false)
  })
})
