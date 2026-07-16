import { computed, ref } from 'vue'
import { getLandingMetrics } from '@/api/landing'
import type { LandingMetricDisplay, LandingMetrics } from '@/types/landing'

const METRIC_BASELINE: LandingMetrics = {
  total_requests: 48219037,
  total_users: 18287,
  stable_uptime_seconds: 8553900,
  generated_at: 0,
}

export function formatUptime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return `${days}d ${hours}h ${String(minutes).padStart(2, '0')}m`
}

export function useLandingMetrics() {
  const serverMetrics = ref<LandingMetrics | null>(null)
  const tick = ref(0)
  let timer: number | undefined

  const elapsed = computed(() => {
    const generatedAt = serverMetrics.value?.generated_at ?? 0
    if (generatedAt > 0) {
      tick.value
      return Math.max(0, Math.floor(Date.now() / 1000) - generatedAt)
    }
    return tick.value
  })

  const display = computed<LandingMetricDisplay>(() => {
    const base = serverMetrics.value ?? METRIC_BASELINE
    return {
      requests: (base.total_requests + elapsed.value * 13).toLocaleString('en-US'),
      users: (base.total_users + Math.floor(elapsed.value / 72)).toLocaleString('en-US'),
      uptime: formatUptime(base.stable_uptime_seconds + elapsed.value),
    }
  })

  async function start() {
    if (timer !== undefined) window.clearInterval(timer)
    timer = window.setInterval(() => { tick.value += 1 }, 1000)
    try {
      serverMetrics.value = await getLandingMetrics()
      tick.value = 0
    } catch {
      serverMetrics.value = null
    }
  }

  function stop() {
    if (timer !== undefined) window.clearInterval(timer)
    timer = undefined
  }

  return { display, start, stop }
}
