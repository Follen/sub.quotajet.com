import { describe, expect, it } from 'vitest'

import type { PublicPricingCatalogue } from '@/api/pricing'
import {
  catalogueModels,
  formatModelPrice,
  modelGroups,
  platformOptions,
} from '../pricingPresentation'

const catalogue: PublicPricingCatalogue = {
  version: 'v1',
  generated_at: '2026-07-18T00:00:00Z',
  platforms: [
    {
      name: 'openai',
      models: [
        {
          name: 'gpt-priced',
          providers: [
            {
              name: 'channel-a',
              group_prices: [
                {
                  name: 'Standard',
                  rate_multiplier: 1,
                  price: {
                    billing_mode: 'token',
                    input_price: 0.00000125,
                    output_price: 0.000005,
                    cache_write_price: null,
                    cache_read_price: null,
                    image_input_price: null,
                    image_output_price: null,
                    per_request_price: null,
                    intervals: [],
                    fallback: false,
                    display_only: false,
                  },
                },
                {
                  name: 'Premium',
                  rate_multiplier: 1.6,
                  price: {
                    billing_mode: 'token',
                    input_price: 0.00000125,
                    output_price: 0.000005,
                    cache_write_price: null,
                    cache_read_price: null,
                    image_input_price: null,
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
  ],
}

describe('pricing presentation adapter', () => {
  it('preserves the Sub2API platform on every flattened model', () => {
    expect(catalogueModels(catalogue)).toMatchObject([
      { name: 'gpt-priced', platform: 'openai' },
    ])
  })

  it('builds vendor choices from platforms rather than channel providers', () => {
    const models = catalogueModels(catalogue)
    expect(platformOptions(models)).toEqual([{ name: 'openai', count: 1 }])
  })

  it('deduplicates public groups and applies their rate multiplier', () => {
    const [model] = catalogueModels(catalogue)
    expect(modelGroups(model)).toEqual(['Premium', 'Standard'])
    expect(formatModelPrice(model, 'input_price', 'M')).toBe('$1.25')
    expect(formatModelPrice(model, 'input_price', 'M', 'Premium')).toBe('$2')
    expect(formatModelPrice(model, 'input_price', 'K', 'Premium')).toBe('$0.002')
  })
})
