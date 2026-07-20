<template>
  <div class="qj-status-shell">
    <main class="qj-status-page page">
      <section :class="['hero', `status-head-${overallTone}`]">
        <div class="hero-copy">
          <h1>{{ t('publicStatus.title') }}</h1>
        </div>
        <div
          class="health-panel"
          data-testid="public-status-overall"
          role="status"
          aria-live="polite"
        >
          <span class="status-dot" aria-hidden="true" />
          <div>
            <span class="health-kicker">{{ t('publicStatus.currentNetworkState') }}</span>
            <strong>{{ overallLabel }}</strong>
          </div>
        </div>
      </section>

      <section class="status-page" :aria-label="t('publicStatus.title')">
        <div v-if="loading && !snapshot" class="monitor-list status-loading" aria-hidden="true">
          <div
            v-for="index in 3"
            :key="index"
            class="monitor-row status-skeleton"
            data-testid="public-status-skeleton"
          />
        </div>

        <div v-else-if="errorMessage && !snapshot" class="monitor-row status-state" role="alert">
          <div class="monitor-name">
            <span class="uptime-badge uptime-down">0.00%</span>
            <div>
              <h3>{{ t('publicStatus.errorTitle') }}</h3>
              <p>{{ errorMessage || t('publicStatus.errorDescription') }}</p>
            </div>
          </div>
          <button type="button" class="status-retry" @click="emit('retry')">
            <Icon name="refresh" size="sm" aria-hidden="true" />
            {{ t('publicStatus.retry') }}
          </button>
        </div>

        <div v-else-if="snapshot && groups.length === 0" class="monitor-row status-state">
          <div class="monitor-name">
            <span class="uptime-badge uptime-unknown">0.00%</span>
            <div>
              <h3>{{ t('publicStatus.emptyTitle') }}</h3>
              <p>{{ t('publicStatus.emptyDescription') }}</p>
            </div>
          </div>
        </div>

        <section
          v-for="group in groups"
          v-else
          :key="group.name"
          class="group-section"
          data-testid="public-status-group"
        >
          <div class="section-heading">
            <h2>{{ group.name }}</h2>
          </div>
          <div class="monitor-list">
            <PublicStatusRow v-for="item in group.items" :key="item.id" :item="item" />
          </div>
        </section>
      </section>

      <section class="refresh-ribbon" :aria-label="t('publicStatus.nextUpdate')">
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

    <footer class="qj-status-footer site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <a class="brand-link" href="https://quotajet.com" aria-label="QuotaJet home">
            <img class="brand-logo" src="/logo.png" alt="" @error="hideBrokenLogo" />
            <span>QuotaJet</span>
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 QuotaJet. {{ t('landing.footer.allRightsReserved') }}</span>
      </div>
    </footer>
  </div>
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
const { t, locale } = useI18n()

const groups = computed(() => {
  const grouped = new Map<string, UserMonitorView[]>()
  for (const item of props.snapshot?.items ?? []) {
    const name = item.group_name.trim() || item.provider || item.name
    grouped.set(name, [...(grouped.get(name) ?? []), item])
  }
  return [...grouped.entries()].map(([name, items]) => ({ name, items }))
})

const overallTone = computed<'operational' | 'degraded' | 'down' | 'unknown'>(() => {
  const value = String(props.snapshot?.overall || '').toLowerCase()
  if (value === 'operational' || value === 'up') return 'operational'
  if (value === 'degraded') return 'degraded'
  if (value === 'down' || value === 'failed' || value === 'error') return 'down'
  return 'unknown'
})

const overallLabel = computed(() => {
  if (overallTone.value === 'down') return t('publicStatus.failed')
  return t(`publicStatus.${overallTone.value}`)
})

const generatedAt = computed(() => {
  if (!props.snapshot?.generated_at) return '-'
  const timestamp = Date.parse(props.snapshot.generated_at)
  if (Number.isNaN(timestamp)) return props.snapshot.generated_at
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp)
})

const formattedCountdown = computed(() => {
  const seconds = Math.max(0, Math.floor(props.countdown))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})

function hideBrokenLogo(event: Event) {
  const target = event.currentTarget as HTMLImageElement
  target.hidden = true
}
</script>
