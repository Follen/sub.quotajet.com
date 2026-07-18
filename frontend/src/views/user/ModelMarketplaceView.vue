<template>
  <AppLayout>
    <ModelMarketplaceShell
      :marketplace="marketplace"
      :loading="loading"
      :error-message="errorMessage"
      :api-origin="apiOrigin"
      @retry="loadMarketplace"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getModelMarketplace, type PublicModelMarketplace } from '@/api/modelMarketplace'
import ModelMarketplaceShell from '@/components/model-marketplace/ModelMarketplaceShell.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
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
