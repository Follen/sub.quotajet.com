<template>
  <article class="pricing-card flex min-h-full flex-col rounded-[10px] border border-pricing p-4">
    <div class="flex items-start gap-3">
      <div class="pricing-model-mark size-9 rounded-lg text-sm">{{ model.name.charAt(0).toUpperCase() || '?' }}</div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <h2 class="truncate font-mono text-sm font-medium">{{ model.name }}</h2>
          <button type="button" class="pricing-icon-button" :aria-label="t('Copy model name')" @click="copyModel">
            <Icon name="copy" size="xs" />
          </button>
        </div>
        <p class="mt-0.5 text-xs text-pricing-muted">{{ formatPlatformName(model.platform) }}</p>
      </div>
    </div>

    <p class="mt-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-pricing-muted">
      {{ modelEndpoints(model).join(' · ') || t('No description available.') }}
    </p>

    <div class="mt-5 grid grid-cols-2 gap-4 border-y border-pricing py-4">
      <div>
        <p class="text-xs text-pricing-muted">{{ t('Input') }}</p>
        <p class="mt-1 truncate text-sm font-semibold tabular-nums">
          {{ modelBillingMode(model) === 'token' ? formatModelPrice(model, 'input_price', unit, selectedGroup) : formatModelFixedPrice(model, selectedGroup) }}
          <span class="ml-1 text-xs font-normal text-pricing-muted">/ {{ modelBillingMode(model) === 'token' ? `${unit === 'M' ? '1M' : '1K'} ${t('tokens')}` : t('request') }}</span>
        </p>
      </div>
      <div>
        <p class="text-xs text-pricing-muted">{{ t('Output') }}</p>
        <p class="mt-1 truncate text-sm font-semibold tabular-nums">
          {{ modelBillingMode(model) === 'token' ? formatModelPrice(model, 'output_price', unit, selectedGroup) : '—' }}
          <span v-if="modelBillingMode(model) === 'token'" class="ml-1 text-xs font-normal text-pricing-muted">/ {{ unit === 'M' ? '1M' : '1K' }} {{ t('tokens') }}</span>
        </p>
      </div>
    </div>

    <div class="mt-4 flex flex-1 flex-col justify-end gap-4">
      <div class="flex min-h-6 flex-wrap items-center gap-1.5">
        <span v-for="group in modelGroups(model).slice(0, 3)" :key="group" class="pricing-group-badge">{{ group }}</span>
      </div>
      <button type="button" class="pricing-details-button self-start" @click="emit('open', model)">
        {{ t('Details') }}
        <Icon name="arrowRight" size="sm" />
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useClipboard } from '@/composables/useClipboard'
import type { PricingCatalogueModel, TokenUnit } from './pricingPresentation'
import {
  formatModelFixedPrice,
  formatModelPrice,
  formatPlatformName,
  modelBillingMode,
  modelEndpoints,
  modelGroups,
} from './pricingPresentation'

const props = withDefaults(defineProps<{
  model: PricingCatalogueModel
  unit: TokenUnit
  selectedGroup?: string
}>(), { selectedGroup: '' })
const emit = defineEmits<{ open: [model: PricingCatalogueModel] }>()
const { t } = useI18n()
const { copyToClipboard } = useClipboard()

function copyModel() {
  void copyToClipboard(props.model.name)
}
</script>
