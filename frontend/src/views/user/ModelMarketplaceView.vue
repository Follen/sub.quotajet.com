<template>
  <main class="model-marketplace-page min-h-screen bg-[#111318] text-slate-100">
    <header class="border-b border-white/[0.08] bg-[#15181e]/95 px-5 py-4 backdrop-blur sm:px-8">
      <div class="mx-auto flex max-w-[1440px] items-center justify-between">
        <a href="/" class="flex items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-violet-300">
          <img src="/logo.png" alt="QuotaJet" class="h-8 w-8 rounded-lg" />
          <span>QuotaJet</span>
        </a>
        <span class="text-xs text-slate-500">{{ t('modelMarketplace.eyebrow') }}</span>
      </div>
    </header>
    <ModelMarketplaceShell
      :marketplace="marketplace"
      :loading="loading"
      :error-message="errorMessage"
      :api-origin="apiOrigin"
      @retry="loadMarketplace"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getModelMarketplace, type PublicModelMarketplace } from '@/api/modelMarketplace'
import ModelMarketplaceShell from '@/components/model-marketplace/ModelMarketplaceShell.vue'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const appStore = useAppStore()
const marketplace = ref<PublicModelMarketplace | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const apiOrigin = computed(() => appStore.apiBaseUrl || window.location.origin)

async function loadMarketplace(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    marketplace.value = await getModelMarketplace()
  } catch (error: unknown) {
    errorMessage.value = extractApiErrorMessage(error, t('modelMarketplace.error.description'))
  } finally {
    loading.value = false
  }
}

onMounted(loadMarketplace)
</script>
