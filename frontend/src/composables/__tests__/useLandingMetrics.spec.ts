import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLandingMetrics } from '@/api/landing'
import { useLandingMetrics } from '@/composables/useLandingMetrics'

vi.mock('@/api/landing', () => ({
  getLandingMetrics: vi.fn()
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

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
    vi.advanceTimersByTime(60_000)
    expect(display.value.requests).toBe('50,000,910')
    expect(display.value.uptime).toBe('1d 0h 01m')
    stop()
  })

  it('keeps only one interval when started repeatedly and stops ticking after cleanup', async () => {
    vi.mocked(getLandingMetrics).mockRejectedValue(new Error('offline'))
    const { display, start, stop } = useLandingMetrics()
    await start()
    await start()

    vi.advanceTimersByTime(1000)
    expect(display.value.requests).toBe('48,219,050')

    stop()
    vi.advanceTimersByTime(1000)
    expect(display.value.requests).toBe('48,219,050')
  })

  it('keeps the latest response when starts overlap', async () => {
    const first = deferred<Awaited<ReturnType<typeof getLandingMetrics>>>()
    const second = deferred<Awaited<ReturnType<typeof getLandingMetrics>>>()
    vi.mocked(getLandingMetrics)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { display, start, stop } = useLandingMetrics()
    const firstStart = start()
    const secondStart = start()

    second.resolve({
      total_requests: 60000000,
      total_users: 21000,
      stable_uptime_seconds: 172800,
      generated_at: Math.floor(Date.now() / 1000),
    })
    await secondStart
    expect(display.value.requests).toBe('60,000,000')

    first.resolve({
      total_requests: 50000000,
      total_users: 20000,
      stable_uptime_seconds: 86400,
      generated_at: Math.floor(Date.now() / 1000),
    })
    await firstStart
    expect(display.value.requests).toBe('60,000,000')
    stop()
  })
})
