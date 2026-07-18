<template>
  <AppLayout>
    <ModelMarketplaceShell
      :marketplace="marketplace"
      :loading="loading"
      :error-message="errorMessage"
      @retry="loadMarketplace"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getModelMarketplace, type PublicModelMarketplace } from '@/api/modelMarketplace'
import ModelMarketplaceShell from '@/components/model-marketplace/ModelMarketplaceShell.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { extractApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const marketplace = ref<PublicModelMarketplace | null>(null)
const loading = ref(false)
const errorMessage = ref('')

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
