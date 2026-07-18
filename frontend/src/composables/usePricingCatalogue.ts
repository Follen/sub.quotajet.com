import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPricing, type PublicPricingCatalogue } from '@/api/pricing'
import { extractApiErrorMessage } from '@/utils/apiError'

export function usePricingCatalogue() {
  const { t } = useI18n()
  const catalogue = ref<PublicPricingCatalogue | null>(null)
  const loading = ref(false)
  const errorMessage = ref('')
  const load = async () => {
    loading.value = true
    errorMessage.value = ''
    try { catalogue.value = await getPricing() } catch (error: unknown) { errorMessage.value = extractApiErrorMessage(error, t('modelMarketplace.error.description')) } finally { loading.value = false }
  }
  onMounted(load)
  return { catalogue, loading, errorMessage, reload: load, loaded: computed(() => !loading.value && catalogue.value !== null) }
}
