import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params?.count == null ? key : `${key}:${String(params.count)}`,
  }),
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copied: { value: false }, copyToClipboard: vi.fn() }),
}))

import type { PublicPricingCatalogue } from '@/api/pricing'
import PricingShell from '../PricingShell.vue'

const marketplace: PublicPricingCatalogue = {
  version: 'v1',
  generated_at: '2026-07-18T00:00:00Z',
  platforms: [
    {
      name: 'openai',
      models: [
        {
          name: 'gpt-5',
          platform_default_inbound_endpoints: ['/v1/chat/completions', '/v1/responses'],
          providers: [
            {
              name: 'channel-hidden-from-vendor-filter',
              group_prices: [
                {
                  name: 'Standard',
                  rate_multiplier: 1,
                  price: {
                    billing_mode: 'token',
                    input_price: 0.000001,
                    output_price: 0.000004,
                    cache_write_price: null,
                    cache_read_price: 0.0000001,
                    image_output_price: null,
                    per_request_price: null,
                    intervals: [],
                    fallback: false,
                    display_only: false,
                  },
                },
                {
                  name: 'Premium',
                  rate_multiplier: 1.5,
                  price: {
                    billing_mode: 'token',
                    input_price: 0.000001,
                    output_price: 0.000004,
                    cache_write_price: null,
                    cache_read_price: 0.0000001,
                    image_output_price: null,
                    per_request_price: null,
                    intervals: [],
                    fallback: false,
                    display_only: false,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'grok',
      models: [{ name: 'grok-4', providers: [] }],
    },
  ],
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/pricing', name: 'Pricing', component: { template: '<div />' } },
      { path: '/pricing/:modelId', name: 'PricingModel', component: { template: '<div />' } },
    ],
  })
}

describe('PricingShell', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    router = createTestRouter()
    await router.push('/pricing')
    await router.isReady()
  })

  it('renders the main-site catalogue structure without a hidden legacy marketplace', () => {
    const wrapper = mount(PricingShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    expect(wrapper.get('[data-testid="pricing-shell"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="pricing-shell"]').classes()).toContain('pt-24')
    expect(wrapper.get('[data-testid="pricing-sidebar"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="pricing-toolbar"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="pricing-table"]').exists()).toBe(true)
    expect(wrapper.find('[aria-hidden="true"] [data-testid^="marketplace-platform-"]').exists()).toBe(false)
  })

  it('uses Sub2API platforms as vendors instead of exposing channel names as vendors', () => {
    const wrapper = mount(PricingShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    const sidebar = wrapper.get('[data-testid="pricing-sidebar"]')
    expect(sidebar.text()).toContain('OpenAI')
    expect(sidebar.text()).toContain('Grok')
    expect(sidebar.text()).not.toContain('channel-hidden-from-vendor-filter')
  })

  it('applies the selected public group multiplier to catalogue prices', async () => {
    const wrapper = mount(PricingShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    expect(wrapper.get('[data-testid="pricing-row-gpt-5"] [data-price="input"]').text()).toContain('$1')
    await wrapper.get('[data-testid="pricing-filter-group-Premium"]').trigger('click')
    expect(wrapper.get('[data-testid="pricing-row-gpt-5"] [data-price="input"]').text()).toContain('$1.5')
  })

  it('filters by model metadata and opens the independent model detail route', async () => {
    const wrapper = mount(PricingShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    await wrapper.get('[data-testid="pricing-search"]').setValue('grok')
    expect(wrapper.find('[data-testid="pricing-row-grok-4"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="pricing-row-gpt-5"]').exists()).toBe(false)

    await wrapper.get('[data-testid="pricing-row-grok-4"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('PricingModel')
    expect(router.currentRoute.value.params.modelId).toBe('grok-4')
  })

  it('shows the public empty state when no models are configured', () => {
    const wrapper = mount(PricingShell, {
      props: {
        marketplace: { version: 'v1', generated_at: '2026-07-18T00:00:00Z', platforms: [] },
      },
      global: { plugins: [router] },
    })

    expect(wrapper.get('[data-testid="marketplace-empty"]').text()).toContain('modelMarketplace.empty.title')
  })
})
