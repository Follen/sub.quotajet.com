<template>
  <section class="rounded-md border border-slate-800 bg-slate-950/60 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-mono text-sm text-slate-100">{{ groupPrice.name }}</p>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('modelMarketplace.prices.groupMultiplier', { multiplier: groupPrice.rate_multiplier }) }}
        </p>
      </div>
      <span v-if="price?.display_only || price?.fallback" class="rounded border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
        {{ t('modelMarketplace.prices.displayOnly') }}
      </span>
    </div>

    <p v-if="!price" class="mt-3 text-sm text-slate-500">{{ t('modelMarketplace.prices.unavailable') }}</p>

    <template v-else>
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <div data-testid="marketplace-base-price" class="rounded border border-slate-800 bg-slate-900/70 p-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{{ t('modelMarketplace.prices.base') }}</p>
          <p v-for="entry in priceEntries" :key="entry.label" class="mt-2 text-sm text-slate-200">
            <span class="text-slate-500">{{ entry.label }}</span> {{ formatMarketplacePrice(entry.value, price.billing_mode, t('modelMarketplace.prices.perMillionTokens')) }}
          </p>
        </div>
        <div data-testid="marketplace-effective-price" class="rounded border border-lime-400/20 bg-lime-400/[0.06] p-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">{{ t('modelMarketplace.prices.effective') }}</p>
          <p v-for="entry in priceEntries" :key="entry.label" class="mt-2 text-sm text-lime-100">
            <span class="text-lime-300/70">{{ entry.label }}</span> {{ formatMarketplacePrice(entry.value * groupPrice.rate_multiplier, price.billing_mode, t('modelMarketplace.prices.perMillionTokens')) }}
          </p>
        </div>
      </div>

      <div v-if="price.intervals.length > 0" class="mt-4 space-y-2">
        <p class="text-xs font-medium text-slate-400">{{ t('modelMarketplace.tiers.title') }}</p>
        <MarketplaceTierTable :intervals="price.intervals" :rate-multiplier="groupPrice.rate_multiplier" :billing-mode="price.billing_mode" />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PublicMarketplaceGroupPrice, PublicMarketplacePrice } from '@/api/modelMarketplace'
import MarketplaceTierTable from './MarketplaceTierTable.vue'
import { formatMarketplacePrice } from './marketplaceFormatters'

interface PriceEntry {
  label: string
  value: number
}

const props = defineProps<{ groupPrice: PublicMarketplaceGroupPrice }>()
const { t } = useI18n()
const price = computed(() => props.groupPrice.price)
const priceEntries = computed<PriceEntry[]>(() => {
  const configuredPrice: PublicMarketplacePrice | null = price.value
  if (!configuredPrice) return []

  const entries: PriceEntry[] = []
  if (configuredPrice.input_price !== null) entries.push({ label: t('modelMarketplace.prices.input'), value: configuredPrice.input_price })
  if (configuredPrice.output_price !== null) entries.push({ label: t('modelMarketplace.prices.output'), value: configuredPrice.output_price })
  if (configuredPrice.cache_write_price !== null) entries.push({ label: t('modelMarketplace.prices.cacheWrite'), value: configuredPrice.cache_write_price })
  if (configuredPrice.cache_read_price !== null) entries.push({ label: t('modelMarketplace.prices.cacheRead'), value: configuredPrice.cache_read_price })
  if (configuredPrice.image_output_price !== null) entries.push({ label: t('modelMarketplace.prices.imageOutput'), value: configuredPrice.image_output_price })
  if (configuredPrice.per_request_price !== null) entries.push({ label: t('modelMarketplace.prices.perRequest'), value: configuredPrice.per_request_price })
  return entries
})

</script>
