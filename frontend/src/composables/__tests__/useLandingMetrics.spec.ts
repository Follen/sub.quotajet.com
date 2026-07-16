import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLandingMetrics } from '@/api/landing'
import { useLandingMetrics } from '@/composables/useLandingMetrics'

vi.mock('@/api/landing', () => ({
  getLandingMetrics: vi.fn()
}))

describe('useLandingMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T00:00:00Z'))
  })

  it('shows approved baselines when the endpoint fails', async () => {
    vi.mocked(getLandingMetrics).mockRejectedValue(new Error('offline'))
    const { display, start, stop } = useLandingMetrics()
    await start()
    expect(display.value).toEqual({
      requests: '48,219,037',
      users: '18,287',
      uptime: '99d 0h 05m',
    })
    stop()
  })

  it('advances from server generated_at instead of request completion time', async () => {
    vi.mocked(getLandingMetrics).mockResolvedValue({
      total_requests: 50000000,
      total_users: 20000,
      stable_uptime_seconds: 86400,
      generated_at: Math.floor(Date.now() / 1000) - 10,
    })
    const { display, start, stop } = useLandingMetrics()
    await start()
    expect(display.value.requests).toBe('50,000,130')
    expect(display.value.uptime).toBe('1d 0h 00m')
    stop()
  })
})
