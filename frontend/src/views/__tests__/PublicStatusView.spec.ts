import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PublicStatusSnapshot } from '@/api/channelMonitor'

const { getPublicStatus } = vi.hoisted(() => ({
  getPublicStatus: vi.fn(),
}))

vi.mock('@/api/channelMonitor', () => ({ getPublicStatus }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/stores', () => ({
  useAppStore: () => ({ cachedPublicSettings: {}, docUrl: '' }),
  useAuthStore: () => ({ isAuthenticated: false }),
}))
vi.mock('@/components/home', () => ({
  HomeHeader: { name: 'HomeHeader', template: '<header data-home-header />' },
}))
vi.mock('@/components/status/PublicStatusPage.vue', () => ({
  default: {
    name: 'PublicStatusPage',
    props: ['snapshot', 'loading', 'errorMessage', 'countdown'],
    emits: ['retry'],
    template: '<main data-status-page />',
  },
}))

import PublicStatusView from '../user/PublicStatusView.vue'

const successfulSnapshot: PublicStatusSnapshot = {
  generated_at: '2026-07-20T00:00:00Z',
  overall: 'operational',
  items: [],
}

let wrapper: VueWrapper | null = null

describe('PublicStatusView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    getPublicStatus.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  it('fetches immediately and silently refreshes after 60 seconds', async () => {
    getPublicStatus.mockResolvedValue(successfulSnapshot)

    wrapper = mount(PublicStatusView)
    await flushPromises()

    expect(getPublicStatus).toHaveBeenCalledTimes(1)
    expect(getPublicStatus.mock.calls[0]?.[0]?.signal).toBeInstanceOf(AbortSignal)
    expect(wrapper.get('.qj-landing.qj-pricing').exists()).toBe(true)
    expect(wrapper.find('[data-home-header]').exists()).toBe(true)
    expect(wrapper.find('.sidebar').exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(59_000)
    expect(getPublicStatus).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)
    await flushPromises()
    expect(getPublicStatus).toHaveBeenCalledTimes(2)
  })

  it('keeps the last snapshot visible when a silent refresh fails', async () => {
    getPublicStatus
      .mockResolvedValueOnce(successfulSnapshot)
      .mockRejectedValueOnce(new Error('offline'))

    wrapper = mount(PublicStatusView)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(60_000)
    await flushPromises()

    const page = wrapper.findComponent({ name: 'PublicStatusPage' })
    expect(page.props('snapshot')).toEqual(successfulSnapshot)
    expect(page.props('errorMessage')).toBe('')
  })

  it('aborts an in-flight request when unmounted', () => {
    let signal: AbortSignal | undefined
    getPublicStatus.mockImplementation((options?: { signal?: AbortSignal }) => {
      signal = options?.signal
      return new Promise(() => {})
    })

    wrapper = mount(PublicStatusView)
    expect(signal?.aborted).toBe(false)

    wrapper.unmount()
    wrapper = null
    expect(signal?.aborted).toBe(true)
  })
})
