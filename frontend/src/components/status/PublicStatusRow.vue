<template>
  <article
    class="public-status-row"
    data-testid="public-status-row"
    :data-status="statusTone"
  >
    <div class="public-status-row__identity">
      <div class="public-status-row__heading">
        <span class="public-status-row__provider-icon" aria-hidden="true">
          <ProviderIcon :provider="item.provider" :size="20" />
        </span>
        <div class="public-status-row__title">
          <h3>{{ item.name }}</h3>
          <p>
            <span>{{ providerLabel(item.provider) }}</span>
            <span aria-hidden="true">/</span>
            <span class="public-status-row__model">{{ item.primary_model }}</span>
          </p>
        </div>
        <span class="public-status-row__status">
          <span class="public-status-row__status-dot" aria-hidden="true" />
          {{ statusLabel(item.primary_status) }}
        </span>
      </div>

      <dl class="public-status-row__metrics">
        <div>
          <dt>{{ t('publicStatus.latency') }}</dt>
          <dd>{{ latency }}</dd>
        </div>
        <div>
          <dt>{{ t('publicStatus.availability') }}</dt>
          <dd>{{ availability }}</dd>
        </div>
      </dl>
    </div>

    <div class="public-status-row__history">
      <span class="public-status-row__history-label">{{ t('publicStatus.history') }}</span>
      <div class="public-status-timeline">
        <span
          v-for="bar in timelineBars"
          :key="bar.key"
          data-testid="status-timeline-bar"
          class="status-timeline-bar"
          :class="`status-timeline-bar--${bar.tone}`"
          :title="bar.label"
          :aria-label="bar.label"
          role="img"
        />
      </div>
      <div class="public-status-row__axis" aria-hidden="true">
        <span>{{ t('publicStatus.recent') }}</span>
        <span>{{ t('publicStatus.now') }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MonitorTimelinePoint, UserMonitorView } from '@/api/channelMonitor'
import ProviderIcon from '@/components/user/monitor/ProviderIcon.vue'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'

const TIMELINE_BAR_COUNT = 30

const props = defineProps<{ item: UserMonitorView }>()

const { t } = useI18n()
const { formatAvailability, formatLatency, providerLabel, statusLabel } = useChannelMonitorFormat()

function toneForStatus(status?: string): 'operational' | 'degraded' | 'failed' | 'unknown' {
  switch (status) {
    case 'operational':
      return 'operational'
    case 'degraded':
      return 'degraded'
    case 'failed':
    case 'error':
      return 'failed'
    default:
      return 'unknown'
  }
}

function timelineLabel(point?: MonitorTimelinePoint): string {
  if (!point) return t('publicStatus.noHistory')
  const checkedAt = Date.parse(point.checked_at)
  const timestamp = Number.isNaN(checkedAt)
    ? point.checked_at
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(checkedAt)
  return `${timestamp}: ${statusLabel(point.status)}`
}

const statusTone = computed(() => toneForStatus(props.item.primary_status))
const latency = computed(() => {
  const value = formatLatency(props.item.primary_latency_ms)
  return props.item.primary_latency_ms == null ? value : `${value} ms`
})
const availability = computed(() => formatAvailability(props.item))
const timelineBars = computed(() => {
  const points = props.item.timeline.slice(-TIMELINE_BAR_COUNT)
  const missingCount = TIMELINE_BAR_COUNT - points.length
  const missing = Array.from({ length: missingCount }, (_, index) => ({
    key: `missing-${index}`,
    tone: 'unknown' as const,
    label: timelineLabel(),
  }))
  const history = points.map((point, index) => ({
    key: `${point.checked_at}-${index}`,
    tone: toneForStatus(point.status),
    label: timelineLabel(point),
  }))
  return [...missing, ...history]
})
</script>
