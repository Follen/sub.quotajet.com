import { describe, expect, it, vi } from 'vitest'

const { get } = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: { version: 'v1', generated_at: '', platforms: [] } }),
}))

vi.mock('../client', () => ({
  apiClient: { get },
}))

import { getModelMarketplace } from '../modelMarketplace'

describe('pricing catalogue API', () => {
  it('uses the public pricing endpoint', async () => {
    await getModelMarketplace()
    expect(get).toHaveBeenCalledWith('/pricing', { signal: undefined })
  })
})
