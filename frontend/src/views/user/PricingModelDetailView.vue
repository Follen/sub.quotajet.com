<template>
  <div class="qj-landing qj-pricing min-h-[100dvh] overflow-x-hidden">
    <AppHeader public-page :public-doc-url="safeDocUrl" />
    <PricingDetailPage
      :marketplace="catalogue"
      :model-id="decodedModelId"
      :loading="loading"
      :error-message="errorMessage"
      :api-origin="apiOrigin"
      @retry="reload"
    />
  </div>
</template>

<script setup lang="ts">
import '@fontsource-variable/public-sans'
import { computed } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import PricingDetailPage from '@/components/pricing/PricingDetailPage.vue'
import { usePricingCatalogue } from '@/composables/usePricingCatalogue'
import { useAppStore } from '@/stores'
import '@/styles/home.css'
import '@/styles/pricing.css'
import { sanitizeUrl } from '@/utils/url'

const props = defineProps<{ modelId: string }>()
const appStore = useAppStore()
const { catalogue, loading, errorMessage, reload } = usePricingCatalogue()
const apiOrigin = computed(() => appStore.apiBaseUrl || window.location.origin)
const safeDocUrl = computed(() =>
  sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''),
)
const decodedModelId = computed(() => props.modelId)
</script>
