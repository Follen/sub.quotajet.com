import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { copyToClipboard } = vi.hoisted(() => ({ copyToClipboard: vi.fn().mockResolvedValue(true) }))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => (key === 'modelMarketplace.prices.perSecond' ? '/s' : key),
  }),
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copied: { value: false }, copyToClipboard }),
}))

import type { PublicPricingCatalogue } from '@/api/pricing'
import PricingDetailPage from '../PricingDetailPage.vue'
import PricingPanel from '../PricingPanel.vue'
import PricingQuickStart from '../PricingQuickStart.vue'

const marketplace: PublicPricingCatalogue = {
  version: 'v1',
  generated_at: '2026-07-18T00:00:00Z',
  platforms: [
    {
      name: 'openai',
      models: [
        {
          name: 'gpt-4.1',
          platform_default_inbound_endpoints: ['/v1/chat/completions', '/v1/responses'],
          capabilities: {
            providers: true,
            pricing: true,
            image_generation: true,
            video_generation: false,
            performance: false,
            uptime: false,
            benchmarks: false,
            apps: false,
            activity: false,
          },
          providers: [
            {
              name: 'OpenAI Direct',
              description: 'Direct public route',
              group_prices: [
                {
                  name: 'standard',
                  rate_multiplier: 1.5,
                  allow_image_generation: false,
                  allow_video_generation: false,
                  price: {
                    billing_mode: 'token',
                    input_price: 0.0000005,
                    output_price: 0.000002,
                    cache_write_price: null,
                    cache_read_price: 0.000000125,
                    image_output_price: null,
                    per_request_price: null,
                    fallback: false,
                    display_only: false,
                    intervals: [
                      {
                        min_tokens: 0,
                        max_tokens: 128000,
                        tier_label: 'Standard context',
                        input_price: 0.0000005,
                        output_price: 0.000002,
                        cache_write_price: null,
                        cache_read_price: 0.000000125,
                        per_request_price: null,
                      },
                      {
                        min_tokens: 128000,
                        max_tokens: null,
                        tier_label: 'Long context',
                        input_price: 0.000001,
                        output_price: 0.000004,
                        cache_write_price: null,
                        cache_read_price: 0.00000025,
                        per_request_price: null,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/pricing', name: 'Pricing', component: { template: '<div />' } },
      { path: '/pricing/:modelId', name: 'PricingModel', component: { template: '<div />' } },
      { path: '/keys', component: { template: '<div />' } },
    ],
  })
}

describe('main-site model detail adaptation', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    copyToClipboard.mockClear()
    router = createTestRouter()
    await router.push('/pricing/gpt-4.1')
    await router.isReady()
  })

  function mountDetail() {
    return mount(PricingDetailPage, {
      props: { marketplace, modelId: 'gpt-4.1', apiOrigin: 'https://api.example.com' },
      global: { plugins: [router] },
    })
  }

  it('renders the independent main-site detail hierarchy without a catalogue sidebar', () => {
    const wrapper = mountDetail()

    expect(wrapper.get('[data-testid="pricing-detail-page"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="pricing-detail-back"]').attributes('href')).toBe('/pricing')
    expect(wrapper.get('h1').text()).toBe('gpt-4.1')
    expect(wrapper.text()).toContain('OpenAI')
    expect(wrapper.find('[data-testid="pricing-sidebar"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="pricing-detail-tab-overview"]').attributes('aria-selected')).toBe('true')
  })

  it('shows base pricing and effective public group pricing with tier intervals', () => {
    const wrapper = mountDetail()
    const group = wrapper.get('[data-testid="pricing-detail-group-standard"]')

    expect(group.text()).toContain('x1.5')
    expect(group.text()).toContain('$0.75')
    expect(group.text()).toContain('$3')
    expect(wrapper.text()).toContain('(0, 128000]')
    expect(wrapper.text()).toContain('(128000, ∞)')
  })

  it('keeps unavailable performance data honest', async () => {
    const wrapper = mountDetail()
    await wrapper.get('[data-testid="pricing-detail-tab-performance"]').trigger('click')

    expect(wrapper.get('[data-testid="pricing-detail-performance-empty"]').text()).toContain(
      'No public performance data is available for this model.',
    )
  })

  it('renders an API tab using the public Sub2API endpoint and selected model', async () => {
    const wrapper = mountDetail()
    await wrapper.get('[data-testid="pricing-detail-tab-api"]').trigger('click')

    const code = wrapper.get('[data-testid="marketplace-quick-start-code"]').text()
    expect(code).toContain('https://api.example.com/v1/chat/completions')
    expect(code).toContain('gpt-4.1')
    expect(wrapper.text()).toContain('/v1/responses')
  })

  it('shows the source-style not-found state for an unknown model', () => {
    const wrapper = mount(PricingDetailPage, {
      props: { marketplace, modelId: 'missing-model' },
      global: { plugins: [router] },
    })
    expect(wrapper.get('[data-testid="pricing-model-not-found"]').text()).toContain('Model not found')
  })
})

describe('Sub2API pricing modes', () => {
  it('renders token, per-request, image, and video prices together', () => {
    const wrapper = mount(PricingPanel, {
      props: {
        groupPrice: {
          name: 'grok-mixed',
          rate_multiplier: 2,
          allow_image_generation: true,
          allow_video_generation: true,
          image_rate_multiplier: 0.5,
          video_rate_multiplier: 0.25,
          image_prices: { price_1k: 0.11 },
          video_prices: { price_480p: 0.04 },
          price: {
            billing_mode: 'token',
            input_price: 0.000001,
            output_price: 0.000002,
            cache_write_price: null,
            cache_read_price: null,
            image_output_price: null,
            per_request_price: 0.03,
            fallback: false,
            display_only: false,
            intervals: [],
          },
        },
      },
    })

    expect(wrapper.get('[data-testid="marketplace-pricing-token"]').text()).toContain('$1 / modelMarketplace.prices.perMillionTokens')
    expect(wrapper.get('[data-testid="marketplace-pricing-per_request"]').text()).toContain('$0.03')
    expect(wrapper.get('[data-testid="marketplace-pricing-image"]').text()).toContain('$0.11')
    expect(wrapper.get('[data-testid="marketplace-pricing-video"]').text()).toContain('$0.04 /s')
  })

  it('does not publish gated media pricing for a disabled group', () => {
    const wrapper = mount(PricingPanel, {
      props: {
        groupPrice: {
          name: 'gated-media',
          rate_multiplier: 1,
          allow_image_generation: false,
          allow_video_generation: false,
          image_prices: { price_1k: 0.11 },
          video_prices: { price_480p: 0.04 },
          price: {
            billing_mode: 'token',
            input_price: 0.000001,
            output_price: null,
            cache_write_price: null,
            cache_read_price: null,
            image_output_price: null,
            per_request_price: null,
            fallback: false,
            display_only: false,
            intervals: [],
          },
        },
      },
    })

    expect(wrapper.get('[data-testid="marketplace-pricing-token"]').text()).toContain('$1')
    expect(wrapper.find('[data-testid="marketplace-pricing-image"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="marketplace-pricing-video"]').exists()).toBe(false)
  })
})

describe('Quick Start safety', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    router = createTestRouter()
    await router.push('/pricing/gpt-4.1')
    await router.isReady()
  })

  it('serializes arbitrary model names safely for JSON and POSIX shell input', async () => {
    const modelName = `gpt'"\\\n$(echo unsafe)`
    const wrapper = mount(PricingQuickStart, {
      props: { apiOrigin: 'https://api.example.com', modelName },
      global: { plugins: [router] },
    })
    const code = wrapper.get('[data-testid="marketplace-quick-start-code"]').text()
    const requestBody = code.slice(code.lastIndexOf('-d ') + 3)
    const decodedBody = requestBody.slice(1, -1).replace(/'"'"'/g, "'")

    expect(JSON.parse(decodedBody)).toMatchObject({ model: modelName })
    await wrapper.get('[data-testid="marketplace-copy-quick-start"]').trigger('click')
    expect(copyToClipboard).toHaveBeenCalledWith(code, 'modelMarketplace.quickStart.copied')
  })

  it('rejects an adversarial API origin', () => {
    const wrapper = mount(PricingQuickStart, {
      props: { apiOrigin: `javascript:alert(1)'; echo injected; #`, modelName: 'gpt-4.1' },
      global: { plugins: [router] },
    })
    const code = wrapper.get('[data-testid="marketplace-quick-start-code"]').text()
    expect(code).not.toContain('javascript:')
    expect(code).not.toContain('echo injected')
    expect(code).toContain('/v1/chat/completions')
  })
})
