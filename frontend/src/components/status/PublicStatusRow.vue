<template>
  <article class="monitor-row public-status-row" data-testid="public-status-row">
    <div class="monitor-name">
      <span :class="['uptime-badge', `uptime-${statusTone}`]">{{ availability }}</span>
      <div class="monitor-copy">
        <h3>{{ item.name }}</h3>
        <p>{{ meta }}</p>
      </div>
    </div>

    <div
      class="monitor-history"
      :aria-label="`${item.name} ${t('publicStatus.history')}`"
    >
      <div class="bar-strip">
        <span
          v-for="bar in timelineBars"
          :key="bar.key"
          :data-testid="bar.testId"
          :class="[
            'bar',
            `bar-${bar.tone}`,
            'status-timeline-bar',
            `status-timeline-bar--${bar.legacyTone}`,
          ]"
          :data-label="bar.label"
          :aria-label="bar.label"
          role="img"
        />
      </div>
      <div class="bar-axis" aria-hidden="true">
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
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'

const VISUAL_BAR_COUNT = 60
const API_HISTORY_COUNT = 30

const props = defineProps<{ item: UserMonitorView }>()

const { t, locale } = useI18n()
const { formatAvailability, providerLabel, statusLabel } = useChannelMonitorFormat()

function toneForStatus(status?: string): 'up' | 'degraded' | 'down' | 'unknown' {
  switch (String(status || '').toLowerCase()) {
    case 'operational':
    case 'up':
      return 'up'
    case 'degraded':
      return 'degraded'
    case 'failed':
    case 'error':
    case 'down':
      return 'down'
    default:
      return 'unknown'
  }
}

function legacyTone(tone: 'up' | 'degraded' | 'down' | 'unknown') {
  if (tone === 'up') return 'operational'
  if (tone === 'down') return 'failed'
  return tone
}

function timelineLabel(point?: MonitorTimelinePoint): string {
  if (!point) return t('publicStatus.noHistory')
  const checkedAt = Date.parse(point.checked_at)
  const timestamp = Number.isNaN(checkedAt)
    ? point.checked_at
    : new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(checkedAt)
  return `${timestamp}: ${statusLabel(point.status)}`
}

const statusTone = computed(() => toneForStatus(props.item.primary_status))
const availability = computed(() => formatAvailability(props.item))
const meta = computed(() => {
  const parts = [providerLabel(props.item.provider), props.item.primary_model]
  if (props.item.primary_latency_ms != null) {
    parts.push(`${Math.round(props.item.primary_latency_ms)}ms`)
  }
  return parts.filter(Boolean).join(' · ')
})

const timelineBars = computed(() => {
  const points = props.item.timeline.slice(0, API_HISTORY_COUNT).reverse()
  const missingCount = VISUAL_BAR_COUNT - points.length
  const missing = Array.from({ length: missingCount }, (_, index) => ({
    key: `missing-${index}`,
    tone: 'unknown' as const,
    legacyTone: 'unknown',
    label: timelineLabel(),
    testId: points.length === 0 ? 'status-timeline-bar' : undefined,
  }))
  const history = points.map((point, index) => {
    const tone = toneForStatus(point.status)
    return {
      key: `${point.checked_at}-${index}`,
      tone,
      legacyTone: legacyTone(tone),
      label: timelineLabel(point),
      testId: 'status-timeline-bar',
    }
  })
  return [...missing, ...history]
})
</script>
