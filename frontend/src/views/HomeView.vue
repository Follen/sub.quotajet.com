<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="homeContent" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <!-- Default Home Page -->
  <div v-else class="qj-landing min-h-screen overflow-x-hidden">
    <HomeHeader :is-authenticated="isAuthenticated" :doc-url="safeDocUrl" />
    <main ref="landingRoot">
      <HomeHero :is-authenticated="isAuthenticated" :metrics="metrics" />
      <PrivacyFeature :is-authenticated="isAuthenticated" />
      <ModelRoutingFeature :is-authenticated="isAuthenticated" />
      <CostVisibilityFeature />
      <ReliabilityFeature :is-authenticated="isAuthenticated" />
      <ToolsMarquee />
      <HomeCallToAction :is-authenticated="isAuthenticated" :doc-url="safeDocUrl" />
    </main>
    <HomeFooter :has-privacy-document="hasPrivacyDocument" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  CostVisibilityFeature,
  HomeCallToAction,
  HomeFooter,
  HomeHeader,
  HomeHero,
  ModelRoutingFeature,
  PrivacyFeature,
  ReliabilityFeature,
  ToolsMarquee,
  useLandingReveal,
} from '@/components/home'
import { useLandingMetrics } from '@/composables/useLandingMetrics'
import { useAppStore, useAuthStore } from '@/stores'
import '@/styles/home.css'
import { sanitizeUrl } from '@/utils/url'

const authStore = useAuthStore()
const appStore = useAppStore()
const landingRoot = ref<HTMLElement | null>(null)

const safeDocUrl = computed(() =>
  sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''),
)
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})
const isAuthenticated = computed(() => authStore.isAuthenticated)
const hasPrivacyDocument = computed(
  () =>
    appStore.cachedPublicSettings?.login_agreement_documents?.some(
      (document) => document.id === 'privacy',
    ) === true,
)
const { display: metrics, start: startMetrics, stop: stopMetrics } = useLandingMetrics()

useLandingReveal(landingRoot)

onMounted(async () => {
  await authStore.checkAuth()
  if (!homeContent.value) await startMetrics()
})

onBeforeUnmount(stopMetrics)
</script>
