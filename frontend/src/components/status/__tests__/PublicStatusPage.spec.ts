import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { PublicStatusSnapshot, UserMonitorView } from '@/api/channelMonitor'
import PublicStatusPage from '../PublicStatusPage.vue'

const messages: Record<string, string> = {
  'publicStatus.title': 'QuotaJet Status',
  'publicStatus.subtitle': 'Live availability across the public AI network.',
  'publicStatus.currentNetworkState': 'Current network state',
  'publicStatus.operational': 'All systems operational',
  'publicStatus.degraded': 'Partial degradation',
  'publicStatus.unknown': 'Status warming up',
  'publicStatus.availability': '7-day availability',
  'publicStatus.latency': 'Request latency',
  'publicStatus.lastCheck': 'Last check',
  'publicStatus.nextUpdate': 'Next update in',
  'publicStatus.emptyTitle': 'No monitored services',
  'publicStatus.emptyDescription': 'Public status data is not available yet.',
  'publicStatus.errorTitle': 'Unable to load status',
  'publicStatus.errorDescription': 'The public status endpoint could not be reached.',
  'publicStatus.retry': 'Try again',
  'publicStatus.failed': 'Service interruption',
  'publicStatus.error': 'Check failed',
  'publicStatus.noHistory': 'No check',
  'publicStatus.history': 'Recent checks',
  'monitorCommon.providers.openai': 'OpenAI',
  'monitorCommon.providers.anthropic': 'Anthropic',
  'monitorCommon.status.operational': 'Operational',
  'monitorCommon.status.degraded': 'Degraded',
  'monitorCommon.status.failed': 'Failed',
  'monitorCommon.status.error': 'Error',
  'monitorCommon.status.unknown': 'Unknown',
  'monitorCommon.latencyEmpty': '-',
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => messages[key] ?? key }),
}))

function monitor(overrides: Partial<UserMonitorView>): UserMonitorView {
  return {
    id: 1,
    name: 'OpenAI primary',
    provider: 'openai',
    group_name: 'Core APIs',
    primary_model: 'gpt-5.4',
    primary_status: 'operational',
    primary_latency_ms: 412,
    primary_ping_latency_ms: 21,
    availability_7d: 99.95,
    extra_models: [],
    timeline: [
      {
        status: 'operational',
        latency_ms: 412,
        ping_latency_ms: 21,
        checked_at: '2026-07-20T00:00:00Z',
      },
    ],
    ...overrides,
  }
}

function snapshot(items: UserMonitorView[], overall = 'operational'): PublicStatusSnapshot {
  return {
    generated_at: '2026-07-20T00:00:00Z',
    overall,
    items,
  }
}

describe('PublicStatusPage', () => {
  it('renders operational health and the public monitor details', () => {
    const wrapper = mount(PublicStatusPage, {
      props: {
        snapshot: snapshot([
          monitor({ id: 1 }),
          monitor({ id: 2, name: 'Claude primary', provider: 'anthropic', primary_model: 'claude-opus-4-1' }),
        ]),
        loading: false,
        errorMessage: '',
        countdown: 60,
      },
    })

    expect(wrapper.get('[data-testid="public-status-overall"]').text()).toContain(
      'All systems operational',
    )
    expect(wrapper.findAll('[data-testid="public-status-row"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('OpenAI')
    expect(wrapper.text()).toContain('gpt-5.4')
    expect(wrapper.text()).toContain('99.95%')
    expect(wrapper.findAll('[data-testid="public-status-group"]')).toHaveLength(1)
    expect(wrapper.get('[data-testid="public-status-group"]').text()).toContain('Core APIs')
    expect(wrapper.find('[data-testid="admin-monitor-action"]').exists()).toBe(false)
  })

  it('renders neutral timeline placeholders when history is missing', () => {
    const wrapper = mount(PublicStatusPage, {
      props: {
        snapshot: snapshot([monitor({ timeline: [] })]),
        loading: false,
        errorMessage: '',
        countdown: 42,
      },
    })

    const bars = wrapper.findAll('[data-testid="status-timeline-bar"]')
    expect(bars.length).toBeGreaterThan(0)
    expect(bars.every((bar) => bar.classes().includes('status-timeline-bar--unknown'))).toBe(true)
  })

  it('renders loading, empty, and retryable error states', async () => {
    const wrapper = mount(PublicStatusPage, {
      props: {
        snapshot: null,
        loading: true,
        errorMessage: '',
        countdown: 60,
      },
    })

    expect(wrapper.findAll('[data-testid="public-status-skeleton"]')).toHaveLength(3)

    await wrapper.setProps({
      snapshot: snapshot([], 'unknown'),
      loading: false,
    })
    expect(wrapper.text()).toContain('No monitored services')
    expect(wrapper.text()).toContain('Public status data is not available yet.')

    await wrapper.setProps({
      snapshot: null,
      errorMessage: 'Network unavailable',
    })
    expect(wrapper.text()).toContain('Unable to load status')
    expect(wrapper.text()).toContain('Network unavailable')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
