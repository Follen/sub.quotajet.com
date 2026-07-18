import { describe, expect, it } from 'vitest'

import en from '../locales/en'
import zh from '../locales/zh'

describe('model marketplace price unit locales', () => {
  it('localizes the per-million token unit in English and Chinese', () => {
    expect(en.modelMarketplace.prices.perMillionTokens).toBe('1M tokens')
    expect(zh.modelMarketplace.prices.perMillionTokens).toBe('每 100 万 tokens')
  })
})
