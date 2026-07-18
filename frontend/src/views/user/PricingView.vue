<template>
  <div class="qj-landing min-h-[100dvh] overflow-x-hidden">
    <HomeHeader :is-authenticated="authStore.isAuthenticated" :doc-url="safeDocUrl" />
    <PricingShell
      :marketplace="marketplace"
      :loading="loading"
      :error-message="errorMessage"
      :api-origin="apiOrigin"
      :model-id="modelId"
      @retry="loadMarketplace"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import '@/styles/home.css'

import { getPricing, type PublicPricingCatalogue } from '@/api/pricing'
import PricingShell from '@/components/pricing/PricingShell.vue'
import { HomeHeader } from '@/components/home'
import { useAppStore, useAuthStore } from '@/stores'
import { extractApiErrorMessage } from '@/utils/apiError'
import { sanitizeUrl } from '@/utils/url'

const { t } = useI18n()
const props = defineProps<{ modelId?: string }>()
const appStore = useAppStore()
const authStore = useAuthStore()
const marketplace = ref<PublicPricingCatalogue | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const apiOrigin = computed(() => appStore.apiBaseUrl || window.location.origin)
const safeDocUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const modelId = computed(() => props.modelId ? decodeURIComponent(props.modelId) : '')

async function loadMarketplace(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    marketplace.value = await getPricing()
  } catch (error: unknown) {
    errorMessage.value = extractApiErrorMessage(error, t('modelMarketplace.error.description'))
  } finally {
    loading.value = false
  }
}

onMounted(loadMarketplace)
</script>
