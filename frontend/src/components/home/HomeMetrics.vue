<template>
  <div
    v-for="metric in metricItems"
    :key="metric.label"
    data-home-metric
    class="landing-border-subtle bg-[var(--landing-surface)] px-4 py-3 font-mono"
  >
    <div class="text-lg font-semibold leading-none md:text-xl">
      {{ metric.value }}
    </div>
    <div class="landing-muted-label mt-2 text-[10px] leading-4 uppercase">
      {{ metric.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LandingMetricDisplay } from '@/types/landing'

const props = defineProps<{
  metrics: LandingMetricDisplay
}>()

const { t } = useI18n()

const metricItems = computed(() => [
  { label: t('landing.hero.metrics.requests'), value: props.metrics.requests },
  { label: t('landing.hero.metrics.users'), value: props.metrics.users },
  { label: t('landing.hero.metrics.uptime'), value: props.metrics.uptime },
])
</script>
