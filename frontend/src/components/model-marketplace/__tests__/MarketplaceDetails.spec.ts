import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { copyToClipboard } = vi.hoisted(() => ({ copyToClipboard: vi.fn().mockResolvedValue(true) }))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copied: { value: false }, copyToClipboard }),
}))

import ModelMarketplaceShell from '../ModelMarketplaceShell.vue'
import MarketplaceQuickStart from '../MarketplaceQuickStart.vue'
import MarketplacePricingPanel from '../MarketplacePricingPanel.vue'
import type { PublicModelMarketplace } from '@/api/modelMarketplace'

const marketplace: PublicModelMarketplace = {
  version: 'v1',
  generated_at: '2026-07-18T00:00:00Z',
  platforms: [
    {
      name: 'OpenAI',
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
                    cache_read_price: 0.125,
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
                        cache_read_price: 0.125,
                        per_request_price: null,
                      },
                      {
                        min_tokens: 128000,
                        max_tokens: null,
                        tier_label: 'Long context',
                        input_price: 0.000001,
                        output_price: 0.000004,
                        cache_write_price: null,
                        cache_read_price: 0.25,
                        per_request_price: null,
                      },
                    ],
                  },
                },
                {
                  name: 'per-request',
                  rate_multiplier: 1,
                  allow_image_generation: false,
                  allow_video_generation: false,
                  price: {
                    billing_mode: 'per_request',
                    input_price: null,
                    output_price: null,
                    cache_write_price: null,
                    cache_read_price: null,
                    image_output_price: null,
                    per_request_price: 0.03,
                    fallback: false,
                    display_only: false,
                    intervals: [],
                  },
                },
                {
                  name: 'default-token-mode',
                  rate_multiplier: 1,
                  allow_image_generation: false,
                  allow_video_generation: false,
                  price: {
                    billing_mode: '',
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
                {
                  name: 'image',
                  rate_multiplier: 1.5,
                  allow_image_generation: true,
                  allow_video_generation: false,
                  image_rate_multiplier: 0.5,
                  image_prices: {
                    price_1k: 0.11,
                    price_2k: 0.22,
                    price_4k: 0.33,
                  },
                  price: {
                    billing_mode: 'image',
                    input_price: null,
                    output_price: null,
                    cache_write_price: null,
                    cache_read_price: null,
                    image_output_price: 0.04,
                    per_request_price: null,
                    fallback: false,
                    display_only: false,
                    intervals: [],
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
      { path: '/models', component: { template: '<div />' } },
      { path: '/keys', component: { template: '<div />' } },
    ],
  })
}

describe('Marketplace details', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    copyToClipboard.mockClear()
    router = createTestRouter()
    await router.push('/models?platform=OpenAI&model=gpt-4.1')
    await router.isReady()
  })

  function mountMarketplace() {
    return mount(ModelMarketplaceShell, {
      props: {
        marketplace,
        apiOrigin: 'https://api.example.com',
      },
      global: { plugins: [router] },
    })
  }

  it('renders provider group rows with base and effective prices', () => {
    const wrapper = mountMarketplace()

    expect(wrapper.get('[data-testid="marketplace-provider-OpenAI Direct"]').text()).toContain('OpenAI Direct')
    expect(wrapper.get('[data-testid="marketplace-group-standard"]').text()).toContain('standard')
    const standard = wrapper.get('[data-testid="marketplace-group-standard"]')
    expect(standard.get('[data-testid="marketplace-base-price"]').text()).toContain('$0.5 / modelMarketplace.prices.perMillionTokens')
    expect(standard.get('[data-testid="marketplace-effective-price"]').text()).toContain('$0.75 / modelMarketplace.prices.perMillionTokens')
  })

  it('renders published endpoint and capability metadata without inventing metrics', () => {
    const wrapper = mountMarketplace()

    expect(wrapper.get('[data-testid="marketplace-platform-default-endpoints"]').text()).toContain('/v1/responses')
    expect(wrapper.get('[data-testid="marketplace-capabilities"]').text()).toContain('modelMarketplace.capabilities.imageGeneration')
    expect(wrapper.find('[data-testid="marketplace-section-empty-benchmarks"]').exists()).toBe(false)
  })

  it('treats an empty billing mode as token pricing', () => {
    const wrapper = mountMarketplace()

    expect(wrapper.get('[data-testid="marketplace-group-default-token-mode"]').get('[data-testid="marketplace-base-price"]').text()).toContain(
      '$1 / modelMarketplace.prices.perMillionTokens',
    )
  })

  it('uses an independent image multiplier instead of the generic group multiplier', () => {
    const wrapper = mountMarketplace()

    expect(wrapper.get('[data-testid="marketplace-group-per-request"]').get('[data-testid="marketplace-base-price"]').text()).toContain('$0.03')
    const imageGroup = wrapper.get('[data-testid="marketplace-group-image"]')
    expect(imageGroup.get('[data-testid="marketplace-base-price"]').text()).toContain('$0.11')
    expect(imageGroup.get('[data-testid="marketplace-effective-price"]').text()).toContain('$0.055')
    expect(imageGroup.text()).toContain('modelMarketplace.prices.groupOverride')
    expect(imageGroup.text()).toContain('modelMarketplace.prices.effectiveDisclaimer')
  })

  it('renders group media overrides when channel pricing is absent', () => {
    const wrapper = mount(MarketplacePricingPanel, {
      props: {
        groupPrice: {
          name: 'image-only',
          rate_multiplier: 1.5,
          image_rate_multiplier: 0.5,
          image_prices: { price_1k: 0.11, price_2k: 0.22, price_4k: 0.33 },
          price: null,
        },
      },
    })

    expect(wrapper.get('[data-testid="marketplace-base-price"]').text()).toContain('$0.11')
    expect(wrapper.get('[data-testid="marketplace-effective-price"]').text()).toContain('$0.055')
    expect(wrapper.text()).toContain('modelMarketplace.prices.groupOverride')
  })

  it('renders token, per-request, image, and video prices together', () => {
    const wrapper = mount(MarketplacePricingPanel, {
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
    expect(wrapper.get('[data-testid="marketplace-pricing-video"]').text()).toContain('$0.01 /s')
  })

  it('renders inclusive tier intervals and tier prices', () => {
    const wrapper = mountMarketplace()

    expect(wrapper.get('[data-testid="marketplace-tier-0"]').text()).toContain('(0, 128000]')
    expect(wrapper.get('[data-testid="marketplace-tier-1"]').text()).toContain('(128000, ∞)')
  })

  it('keeps unsupported metric sections visible with an honest empty state', async () => {
    const wrapper = mountMarketplace()

    await wrapper.get('[data-testid="marketplace-detail-nav-benchmarks"]').trigger('click')

    expect(wrapper.get('[data-testid="marketplace-section-empty-benchmarks"]').text()).toContain(
      'modelMarketplace.sections.benchmarks.empty',
    )
  })

  it('substitutes the selected model into Quick Start and copies the request', async () => {
    const wrapper = mountMarketplace()

    expect(wrapper.get('[data-testid="marketplace-quick-start-code"]').text()).toContain('https://api.example.com/v1')
    expect(wrapper.get('[data-testid="marketplace-quick-start-code"]').text()).toContain('gpt-4.1')

    await wrapper.get('[data-testid="marketplace-copy-quick-start"]').trigger('click')

    expect(copyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('"model": "gpt-4.1"'),
      'modelMarketplace.quickStart.copied',
    )
  })

  it('links Quick Start key creation to the authenticated keys page', async () => {
    const wrapper = mountMarketplace()
    await flushPromises()

    expect(wrapper.get('[data-testid="marketplace-create-api-key"]').attributes('href')).toBe('/keys')
  })

  it('serializes arbitrary model names safely for JSON and POSIX shell input', async () => {
    const modelName = `gpt'"\\\n$(echo unsafe)`
    const wrapper = mount(MarketplaceQuickStart, {
      props: { apiOrigin: 'https://api.example.com', modelName },
      global: { plugins: [router] },
    })
    const code = wrapper.get('[data-testid="marketplace-quick-start-code"]').text()
    const requestBody = code.slice(code.lastIndexOf('-d ') + 3)
    const decodedBody = requestBody.slice(1, -1).replace(/'"'"'/g, "'")

    expect(JSON.parse(decodedBody)).toMatchObject({ model: modelName })
    expect(requestBody).toContain("'\"'\"'")

    await wrapper.get('[data-testid="marketplace-copy-quick-start"]').trigger('click')
    expect(copyToClipboard).toHaveBeenCalledWith(code, 'modelMarketplace.quickStart.copied')
  })

  it('validates and shell-quotes an adversarial API origin', () => {
    const wrapper = mount(MarketplaceQuickStart, {
      props: {
        apiOrigin: `javascript:alert(1)'; echo injected; #`,
        modelName: 'gpt-4.1',
      },
      global: { plugins: [router] },
    })

    const code = wrapper.get('[data-testid="marketplace-quick-start-code"]').text()
    expect(code).not.toContain('javascript:')
    expect(code).not.toContain('echo injected')
    expect(code).toContain("curl '")
    expect(code).toContain("/v1/chat/completions'")
  })

  it('resolves a relative API base against the current origin', () => {
    const wrapper = mount(MarketplaceQuickStart, {
      props: { apiOrigin: '/api/v1', modelName: 'gpt-4.1' },
      global: { plugins: [router] },
    })

    expect(wrapper.get('[data-testid="marketplace-quick-start-code"]').text()).toContain(
      "curl 'http://localhost:3000/api/v1/chat/completions'",
    )
  })
})
