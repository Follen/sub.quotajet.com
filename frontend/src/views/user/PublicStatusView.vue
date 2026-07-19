<template>
  <div class="qj-landing qj-pricing min-h-[100dvh] overflow-x-hidden">
    <HomeHeader :is-authenticated="authStore.isAuthenticated" :doc-url="safeDocUrl" public-catalog />
    <PublicStatusPage
      :snapshot="snapshot"
      :loading="loading"
      :error-message="errorMessage"
      :countdown="countdown"
      @retry="reload(false)"
    />
  </div>
</template>

<script setup lang="ts">
import '@fontsource-variable/public-sans'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPublicStatus, type PublicStatusSnapshot } from '@/api/channelMonitor'
import { HomeHeader } from '@/components/home'
import PublicStatusPage from '@/components/status/PublicStatusPage.vue'
import { useAppStore, useAuthStore } from '@/stores'
import '@/styles/home.css'
import '@/styles/pricing.css'
import '@/styles/status.css'
import { extractApiErrorMessage } from '@/utils/apiError'
import { sanitizeUrl } from '@/utils/url'

const REFRESH_SECONDS = 60

const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const snapshot = ref<PublicStatusSnapshot | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const countdown = ref(REFRESH_SECONDS)
const safeDocUrl = computed(() =>
  sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''),
)

let abortController: AbortController | null = null
let refreshInterval: number | null = null

function isCanceled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const canceled = error as { name?: string; code?: string }
  return canceled.name === 'AbortError' || canceled.code === 'ERR_CANCELED'
}

async function reload(silent = false) {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller

  if (!silent) loading.value = true
  try {
    const nextSnapshot = await getPublicStatus({ signal: controller.signal })
    if (controller.signal.aborted || abortController !== controller) return
    snapshot.value = nextSnapshot
    errorMessage.value = ''
    countdown.value = REFRESH_SECONDS
  } catch (error: unknown) {
    if (isCanceled(error) || abortController !== controller) return
    if (!snapshot.value) {
      errorMessage.value = extractApiErrorMessage(error, t('publicStatus.errorDescription'))
    }
  } finally {
    if (abortController === controller) {
      loading.value = false
      abortController = null
    }
  }
}

onMounted(() => {
  void reload(false)
  refreshInterval = window.setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1
      return
    }
    countdown.value = REFRESH_SECONDS
    void reload(true)
  }, 1000)
})

onBeforeUnmount(() => {
  abortController?.abort()
  if (refreshInterval !== null) window.clearInterval(refreshInterval)
})
</script>
