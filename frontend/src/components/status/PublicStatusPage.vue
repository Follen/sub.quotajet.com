<template>
  <main class="public-status-page">
    <section class="public-status-hero" :data-overall="overallTone">
      <div class="public-status-hero__copy">
        <h1>{{ t('publicStatus.title') }}</h1>
        <p>{{ t('publicStatus.subtitle') }}</p>
      </div>
      <div
        class="public-status-overall"
        data-testid="public-status-overall"
        role="status"
        aria-live="polite"
      >
        <span class="public-status-overall__dot" aria-hidden="true" />
        <div>
          <span>{{ t('publicStatus.currentNetworkState') }}</span>
          <strong>{{ overallLabel }}</strong>
        </div>
      </div>
    </section>

    <section class="public-status-content" :aria-label="t('publicStatus.title')">
      <div v-if="loading && !snapshot" class="public-status-loading" aria-hidden="true">
        <div
          v-for="index in 3"
          :key="index"
          class="public-status-skeleton"
          data-testid="public-status-skeleton"
        />
      </div>

      <div v-else-if="errorMessage && !snapshot" class="public-status-state" role="alert">
        <Icon name="exclamationCircle" size="lg" aria-hidden="true" />
        <h2>{{ t('publicStatus.errorTitle') }}</h2>
        <p>{{ errorMessage || t('publicStatus.errorDescription') }}</p>
        <button type="button" class="public-status-retry" @click="emit('retry')">
          <Icon name="refresh" size="sm" aria-hidden="true" />
          {{ t('publicStatus.retry') }}
        </button>
      </div>

      <div v-else-if="snapshot && groups.length === 0" class="public-status-state">
        <Icon name="server" size="lg" aria-hidden="true" />
        <h2>{{ t('publicStatus.emptyTitle') }}</h2>
        <p>{{ t('publicStatus.emptyDescription') }}</p>
      </div>

      <div v-else class="public-status-groups">
        <section
          v-for="group in groups"
          :key="group.name"
          class="public-status-group"
          data-testid="public-status-group"
        >
          <h2>{{ group.name }}</h2>
          <div class="public-status-group__rows">
            <PublicStatusRow v-for="item in group.items" :key="item.id" :item="item" />
          </div>
        </section>
      </div>
    </section>

    <section class="public-status-refresh" :aria-label="t('publicStatus.nextUpdate')">
      <span>
        {{ t('publicStatus.lastCheck') }}
        <strong>{{ generatedAt }}</strong>
      </span>
      <span>
        {{ t('publicStatus.nextUpdate') }}
        <strong data-testid="public-status-countdown">{{ formattedCountdown }}</strong>
      </span>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PublicStatusSnapshot, UserMonitorView } from '@/api/channelMonitor'
import Icon from '@/components/icons/Icon.vue'
import PublicStatusRow from './PublicStatusRow.vue'

const props = defineProps<{
  snapshot: PublicStatusSnapshot | null
  loading: boolean
  errorMessage: string
  countdown: number
}>()

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()

const groups = computed(() => {
  const grouped = new Map<string, UserMonitorView[]>()
  for (const item of props.snapshot?.items ?? []) {
    const name = item.group_name.trim() || item.name
    grouped.set(name, [...(grouped.get(name) ?? []), item])
  }
  return [...grouped.entries()].map(([name, items]) => ({ name, items }))
})

const overallTone = computed<'operational' | 'degraded' | 'unknown'>(() => {
  if (props.snapshot?.overall === 'operational') return 'operational'
  if (props.snapshot?.overall === 'degraded') return 'degraded'
  return 'unknown'
})

const overallLabel = computed(() => t(`publicStatus.${overallTone.value}`))
const generatedAt = computed(() => {
  if (!props.snapshot?.generated_at) return '-'
  const timestamp = Date.parse(props.snapshot.generated_at)
  if (Number.isNaN(timestamp)) return props.snapshot.generated_at
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
})
const formattedCountdown = computed(() => {
  const seconds = Math.max(0, Math.floor(props.countdown))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
</script>
