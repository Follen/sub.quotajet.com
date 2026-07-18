<template>
  <div class="qj-landing min-h-[100dvh] overflow-x-hidden"><HomeHeader :is-authenticated="authStore.isAuthenticated" :doc-url="safeDocUrl" public-catalog /><PricingShell :marketplace="catalogue" :loading="loading" :error-message="errorMessage" :api-origin="apiOrigin" @retry="reload" /></div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import '@/styles/home.css'
import { HomeHeader } from '@/components/home'; import PricingShell from '@/components/pricing/PricingShell.vue'; import { usePricingCatalogue } from '@/composables/usePricingCatalogue'; import { useAppStore, useAuthStore } from '@/stores'; import { sanitizeUrl } from '@/utils/url'
const appStore = useAppStore(); const authStore = useAuthStore(); const { catalogue, loading, errorMessage, reload } = usePricingCatalogue(); const apiOrigin = computed(() => appStore.apiBaseUrl || window.location.origin); const safeDocUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
</script>
