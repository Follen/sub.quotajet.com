<template>
  <div v-if="intervals.length > 0" class="overflow-x-auto rounded-md border border-slate-800">
    <table class="min-w-full divide-y divide-slate-800 text-left text-xs">
      <thead class="bg-slate-950/70 text-slate-500">
        <tr>
          <th class="px-3 py-2 font-medium">{{ t('modelMarketplace.tiers.interval') }}</th>
          <th class="px-3 py-2 font-medium">{{ t('modelMarketplace.tiers.base') }}</th>
          <th class="px-3 py-2 font-medium">{{ t('modelMarketplace.tiers.effective') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800 bg-slate-950/30 text-slate-300">
        <tr v-for="(tier, index) in intervals" :key="`${tier.min_tokens}-${tier.max_tokens ?? 'infinity'}-${tier.tier_label ?? ''}`" :data-testid="`marketplace-tier-${index}`">
          <td class="whitespace-nowrap px-3 py-2 align-top font-mono text-slate-200">
            <p v-if="tier.tier_label" class="font-sans text-slate-400">{{ tier.tier_label }}</p>
            {{ tierInterval(tier) }}
          </td>
          <td class="px-3 py-2 align-top">
            <p v-for="entry in tierEntries(tier)" :key="entry.label">{{ entry.label }} {{ formatMarketplacePrice(entry.value, billingMode) }}</p>
          </td>
          <td class="px-3 py-2 align-top text-lime-300">
            <p v-for="entry in tierEntries(tier)" :key="entry.label">{{ entry.label }} {{ formatMarketplacePrice(entry.value * rateMultiplier, billingMode) }}</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { PublicMarketplaceTierInterval } from '@/api/modelMarketplace'
import { formatMarketplacePrice } from './marketplaceFormatters'

interface PriceEntry {
  label: string
  value: number
}

defineProps<{
  intervals: PublicMarketplaceTierInterval[]
  rateMultiplier: number
  billingMode: string
}>()

const { t } = useI18n()

function tierEntries(tier: PublicMarketplaceTierInterval): PriceEntry[] {
  const entries: PriceEntry[] = []
  if (tier.input_price !== null) entries.push({ label: t('modelMarketplace.prices.input'), value: tier.input_price })
  if (tier.output_price !== null) entries.push({ label: t('modelMarketplace.prices.output'), value: tier.output_price })
  if (tier.cache_write_price !== null) entries.push({ label: t('modelMarketplace.prices.cacheWrite'), value: tier.cache_write_price })
  if (tier.cache_read_price !== null) entries.push({ label: t('modelMarketplace.prices.cacheRead'), value: tier.cache_read_price })
  if (tier.per_request_price !== null) entries.push({ label: t('modelMarketplace.prices.perRequest'), value: tier.per_request_price })
  return entries
}

function tierInterval(tier: PublicMarketplaceTierInterval): string {
  return tier.max_tokens === null
    ? `(${tier.min_tokens}, ∞) ${t('modelMarketplace.tiers.tokens')}`
    : `(${tier.min_tokens}, ${tier.max_tokens}] ${t('modelMarketplace.tiers.tokens')}`
}
</script>
