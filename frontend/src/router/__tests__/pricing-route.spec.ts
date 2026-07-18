import { describe, expect, it } from 'vitest'
import { MODEL_MARKETPLACE_PATH } from '../index'

describe('model marketplace public route', () => {
  it('uses the pricing page path so the existing /models API remains untouched', () => {
    expect(MODEL_MARKETPLACE_PATH).toBe('/pricing')
  })
})
