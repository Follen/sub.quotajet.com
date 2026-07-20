<template>
  <section data-testid="pricing-detail-page" class="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
    <div v-if="loading" class="space-y-4">
      <div class="h-5 w-16 animate-pulse rounded bg-pricing-muted" />
      <div class="h-12 w-80 animate-pulse rounded-[10px] bg-pricing-muted" />
      <div class="h-20 animate-pulse rounded-xl border border-pricing bg-pricing-muted" />
      <div class="h-80 animate-pulse rounded-xl border border-pricing bg-pricing-muted" />
    </div>

    <div v-else-if="errorMessage" class="rounded-[10px] border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
      {{ errorMessage }}
      <button type="button" class="ml-3 underline" @click="emit('retry')">{{ t('modelMarketplace.error.retry') }}</button>
    </div>

    <div v-else-if="!model" data-testid="pricing-model-not-found" class="py-16 text-center">
      <h2 class="text-base font-semibold">{{ t('Model not found') }}</h2>
      <p class="mt-1 text-sm text-pricing-muted">{{ t("The model you're looking for doesn't exist.") }}</p>
      <RouterLink to="/pricing" class="pricing-control-button mt-4">{{ t('Back to Models') }}</RouterLink>
    </div>

    <template v-else>
      <RouterLink data-testid="pricing-detail-back" to="/pricing" class="pricing-details-button mb-8 -ml-2">
        <Icon name="arrowLeft" size="sm" />
        {{ t('Back') }}
      </RouterLink>

      <header class="space-y-5">
        <div class="flex items-start gap-4">
          <div class="pricing-model-mark size-12 rounded-xl text-base">{{ model.name.charAt(0).toUpperCase() || '?' }}</div>
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <h1 class="truncate font-mono text-lg font-semibold tracking-tight">{{ model.name }}</h1>
              <button type="button" class="pricing-icon-button" :aria-label="t('Copy model name')" @click="copyModelName">
                <Icon name="copy" size="xs" />
              </button>
              <span v-if="hasFallbackPricing" class="pricing-warning-badge">{{ t('Reference pricing') }}</span>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-pricing-muted">
              <span>{{ formatPlatformName(model.platform) }}</span>
              <span class="opacity-40">·</span>
              <span>{{ modelBillingMode(model) === 'token' ? t('Token-based') : t('Per Request') }}</span>
            </div>
          </div>
        </div>

        <div v-if="modelEndpoints(model).length" class="flex flex-wrap gap-1.5">
          <span v-for="endpoint in modelEndpoints(model)" :key="endpoint" class="pricing-badge">{{ endpoint }}</span>
        </div>
      </header>

      <div class="mt-8 space-y-8">
        <PricingDetailNav v-model="activeSection" />
        <PricingModelDetails
          :model="model"
          :active-section="activeSection"
          :unit="unit"
          :api-origin="apiOrigin"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import type { PublicPricingCatalogue } from '@/api/pricing'
import Icon from '@/components/icons/Icon.vue'
import { useClipboard } from '@/composables/useClipboard'
import PricingDetailNav, { type PricingDetailSection } from './PricingDetailNav.vue'
import PricingModelDetails from './PricingModelDetails.vue'
import {
  catalogueModels,
  formatPlatformName,
  groupPriceEntries,
  modelBillingMode,
  modelEndpoints,
  type TokenUnit,
} from './pricingPresentation'

const props = withDefaults(defineProps<{
  marketplace?: PublicPricingCatalogue | null
  modelId: string
  loading?: boolean
  errorMessage?: string
  apiOrigin?: string
}>(), { marketplace: null, loading: false, errorMessage: '', apiOrigin: '' })

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
const route = useRoute()
const { copyToClipboard } = useClipboard()
const activeSection = ref<PricingDetailSection>('overview')
const unit = computed<TokenUnit>(() => route.query.tokenUnit === 'K' ? 'K' : 'M')
const model = computed(() => {
  const models = catalogueModels(props.marketplace).filter((item) => item.name === props.modelId)
  const platform = typeof route.query.platform === 'string' ? route.query.platform : ''
  return models.find((item) => item.platform === platform) ?? models[0]
})
const hasFallbackPricing = computed(() =>
  model.value ? groupPriceEntries(model.value).some((entry) => entry.price?.fallback) : false,
)
function copyModelName() {
  if (model.value) void copyToClipboard(model.value.name)
}
</script>
