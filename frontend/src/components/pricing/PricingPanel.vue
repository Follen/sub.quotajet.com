<template>
  <section class="rounded-md border border-slate-800 bg-slate-950/60 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-mono text-sm text-slate-100">{{ groupPrice.name }}</p>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('modelMarketplace.prices.groupMultiplier', { multiplier: groupPrice.rate_multiplier }) }}
        </p>
        <p v-for="section in pricingSections" :key="`multiplier-${section.mode}`" class="mt-1 text-xs text-slate-500">
          {{ t('modelMarketplace.prices.modeMultiplier', { mode: section.label, multiplier: section.multiplier }) }}
        </p>
      </div>
      <span v-if="price?.display_only || price?.fallback" class="rounded border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
        {{ t('modelMarketplace.prices.displayOnly') }}
      </span>
    </div>

    <p v-if="pricingSections.length === 0" class="mt-3 text-sm text-slate-500">{{ t('modelMarketplace.prices.unavailable') }}</p>

    <div v-else class="mt-4 space-y-4">
      <article
        v-for="(section, index) in pricingSections"
        :key="section.mode"
        :data-testid="`marketplace-pricing-${section.mode}`"
        class="rounded border border-slate-800/80 bg-slate-950/30 p-3"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{{ section.label }}</p>
          <p v-if="section.hasMediaOverride" class="text-[11px] text-lime-200/80">{{ t('modelMarketplace.prices.groupOverride') }}</p>
        </div>
        <p v-if="section.partialMediaOverride" class="mt-1 text-[11px] leading-5 text-amber-200/80">{{ t('modelMarketplace.prices.partialOverride') }}</p>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <div :data-testid="index === 0 ? 'marketplace-base-price' : `marketplace-base-price-${section.mode}`" class="rounded border border-slate-800 bg-slate-900/70 p-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{{ t('modelMarketplace.prices.base') }}</p>
            <p v-for="entry in section.entries" :key="entry.label" class="mt-2 text-sm text-slate-200">
              <span class="text-slate-500">{{ entry.label }}</span> {{ formatMarketplacePrice(entry.value, section.billingMode, t('modelMarketplace.prices.perMillionTokens')) }}<span v-if="entry.unit">{{ entry.unit }}</span>
            </p>
          </div>
          <div :data-testid="index === 0 ? 'marketplace-effective-price' : `marketplace-effective-price-${section.mode}`" class="rounded border border-lime-400/20 bg-lime-400/[0.06] p-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">{{ t('modelMarketplace.prices.effective') }}</p>
            <p v-for="entry in section.entries" :key="entry.label" class="mt-2 text-sm text-lime-100">
              <span class="text-lime-300/70">{{ entry.label }}</span> {{ formatMarketplacePrice(entry.value * section.multiplier, section.billingMode, t('modelMarketplace.prices.perMillionTokens')) }}<span v-if="entry.unit">{{ entry.unit }}</span>
            </p>
            <p class="mt-3 text-[11px] leading-5 text-lime-200/70">{{ t('modelMarketplace.prices.effectiveDisclaimer') }}</p>
          </div>
        </div>

        <div v-if="section.intervals.length > 0" class="mt-4 space-y-2">
          <p class="text-xs font-medium text-slate-400">{{ t('modelMarketplace.tiers.title') }}</p>
          <PricingTierTable :intervals="section.intervals" :rate-multiplier="section.multiplier" :billing-mode="section.billingMode" />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type {
  PublicMarketplaceGroupPrice,
  PublicMarketplaceImagePrices,
  PublicMarketplacePrice,
  PublicMarketplaceTierInterval,
  PublicMarketplaceVideoPrices,
} from '@/api/pricing'
import PricingTierTable from './PricingTierTable.vue'
import { formatMarketplacePrice } from './pricingFormatters'

type PricingMode = 'token' | 'per_request' | 'image' | 'video'

interface PriceEntry {
  label: string
  value: number
  unit?: string
}

interface PricingSection {
  mode: PricingMode
  billingMode: PricingMode
  label: string
  entries: PriceEntry[]
  intervals: PublicMarketplaceTierInterval[]
  multiplier: number
  hasMediaOverride: boolean
  partialMediaOverride: boolean
}

const props = defineProps<{ groupPrice: PublicMarketplaceGroupPrice }>()
const { t } = useI18n()
const price = computed(() => props.groupPrice.price)
const imagePrices = computed(() => props.groupPrice.image_prices ?? null)
const videoPrices = computed(() => props.groupPrice.video_prices ?? null)

function normalizeBillingMode(mode: string | undefined): PricingMode {
  switch (mode) {
    case 'per_request':
      return 'per_request'
    case 'image':
      return 'image'
    case 'video':
      return 'video'
    default:
      return 'token'
  }
}

function modeLabel(mode: PricingMode): string {
  return t(`modelMarketplace.prices.mode${mode === 'per_request' ? 'PerRequest' : mode[0].toUpperCase() + mode.slice(1)}`)
}

function modeMultiplier(mode: PricingMode): number {
  if (mode === 'image') return props.groupPrice.image_rate_multiplier ?? props.groupPrice.rate_multiplier
  if (mode === 'video') return props.groupPrice.video_rate_multiplier ?? props.groupPrice.rate_multiplier
  return props.groupPrice.rate_multiplier
}

function imageOverrideEntries(prices: PublicMarketplaceImagePrices | null): PriceEntry[] {
  if (!prices) return []
  const entries: PriceEntry[] = []
  if (prices.price_1k !== null && prices.price_1k !== undefined) entries.push({ label: t('modelMarketplace.prices.image1K'), value: prices.price_1k })
  if (prices.price_2k !== null && prices.price_2k !== undefined) entries.push({ label: t('modelMarketplace.prices.image2K'), value: prices.price_2k })
  if (prices.price_4k !== null && prices.price_4k !== undefined) entries.push({ label: t('modelMarketplace.prices.image4K'), value: prices.price_4k })
  return entries
}

function videoOverrideEntries(prices: PublicMarketplaceVideoPrices | null): PriceEntry[] {
  if (!prices) return []
  const entries: PriceEntry[] = []
  const perSecondUnit = ` ${t('modelMarketplace.prices.perSecond')}`
  if (prices.price_480p !== null && prices.price_480p !== undefined) entries.push({ label: t('modelMarketplace.prices.video480P'), value: prices.price_480p, unit: perSecondUnit })
  if (prices.price_720p !== null && prices.price_720p !== undefined) entries.push({ label: t('modelMarketplace.prices.video720P'), value: prices.price_720p, unit: perSecondUnit })
  if (prices.price_1080p !== null && prices.price_1080p !== undefined) entries.push({ label: t('modelMarketplace.prices.video1080P'), value: prices.price_1080p, unit: perSecondUnit })
  return entries
}

function tokenEntries(configuredPrice: PublicMarketplacePrice | null): PriceEntry[] {
  if (!configuredPrice) return []
  const entries: PriceEntry[] = []
  if (configuredPrice.input_price !== null) entries.push({ label: t('modelMarketplace.prices.input'), value: configuredPrice.input_price })
  if (configuredPrice.output_price !== null) entries.push({ label: t('modelMarketplace.prices.output'), value: configuredPrice.output_price })
  if (configuredPrice.cache_write_price !== null) entries.push({ label: t('modelMarketplace.prices.cacheWrite'), value: configuredPrice.cache_write_price })
  if (configuredPrice.cache_read_price !== null) entries.push({ label: t('modelMarketplace.prices.cacheRead'), value: configuredPrice.cache_read_price })
  return entries
}

function perRequestEntries(configuredPrice: PublicMarketplacePrice | null): PriceEntry[] {
  if (!configuredPrice || configuredPrice.per_request_price === null) return []
  return [{ label: t('modelMarketplace.prices.perRequest'), value: configuredPrice.per_request_price }]
}

function mediaPartialOverride(values: Array<number | null | undefined>): boolean {
  return values.some((value) => value === null || value === undefined)
}

const pricingSections = computed<PricingSection[]>(() => {
  const configuredPrice = price.value
  const declaredMode = normalizeBillingMode(configuredPrice?.billing_mode)
  const imageAllowed = props.groupPrice.allow_image_generation !== false
  const videoAllowed = props.groupPrice.allow_video_generation !== false
  const imageEntries = imageAllowed ? imageOverrideEntries(imagePrices.value) : []
  const videoEntries = videoAllowed ? videoOverrideEntries(videoPrices.value) : []
  const sections: PricingSection[] = []
  const tokenPriceEntries = tokenEntries(configuredPrice)
  const tokenIntervals = configuredPrice && declaredMode === 'token' ? configuredPrice.intervals : []
  if (tokenPriceEntries.length > 0 || tokenIntervals.length > 0 || (configuredPrice !== null && declaredMode === 'token')) {
    sections.push({
      mode: 'token',
      billingMode: 'token',
      label: modeLabel('token'),
      entries: tokenPriceEntries,
      intervals: tokenIntervals,
      multiplier: modeMultiplier('token'),
      hasMediaOverride: false,
      partialMediaOverride: false,
    })
  }

  const requestModeAllowed = declaredMode === 'image' ? imageAllowed : declaredMode === 'video' ? videoAllowed : true
  const requestPriceEntries = requestModeAllowed ? perRequestEntries(configuredPrice) : []
  const requestIntervals = requestModeAllowed && configuredPrice && declaredMode === 'per_request' ? configuredPrice.intervals : []
  if (requestPriceEntries.length > 0 || requestIntervals.length > 0 || declaredMode === 'per_request') {
    sections.push({
      mode: 'per_request',
      billingMode: 'per_request',
      label: modeLabel('per_request'),
      entries: requestPriceEntries,
      intervals: requestIntervals,
      multiplier: modeMultiplier('per_request'),
      hasMediaOverride: false,
      partialMediaOverride: false,
    })
  }

  const imageChannelEntries = imageAllowed && imageEntries.length > 0
    ? imageEntries
    : imageAllowed && configuredPrice?.image_output_price !== null && configuredPrice?.image_output_price !== undefined
      ? [{ label: t('modelMarketplace.prices.imageOutput'), value: configuredPrice.image_output_price }]
      : imageAllowed && declaredMode === 'image' && requestPriceEntries.length > 0
        ? requestPriceEntries
        : []
  const imageIntervals = imageAllowed && configuredPrice && declaredMode === 'image' ? configuredPrice.intervals : []
  if (imageAllowed && (imageChannelEntries.length > 0 || imageIntervals.length > 0 || imageEntries.length > 0 || declaredMode === 'image')) {
    sections.push({
      mode: 'image',
      billingMode: 'image',
      label: modeLabel('image'),
      entries: imageChannelEntries,
      intervals: imageIntervals,
      multiplier: modeMultiplier('image'),
      hasMediaOverride: imageEntries.length > 0,
      partialMediaOverride: imageEntries.length > 0 && mediaPartialOverride([imagePrices.value?.price_1k, imagePrices.value?.price_2k, imagePrices.value?.price_4k]),
    })
  }

  const videoChannelEntries = videoAllowed && videoEntries.length > 0
    ? videoEntries
    : videoAllowed && declaredMode === 'video' && requestPriceEntries.length > 0
      ? requestPriceEntries
      : []
  const videoIntervals = videoAllowed && configuredPrice && declaredMode === 'video' ? configuredPrice.intervals : []
  if (videoAllowed && (videoChannelEntries.length > 0 || videoIntervals.length > 0 || videoEntries.length > 0 || declaredMode === 'video')) {
    sections.push({
      mode: 'video',
      billingMode: 'video',
      label: modeLabel('video'),
      entries: videoChannelEntries,
      intervals: videoIntervals,
      multiplier: modeMultiplier('video'),
      hasMediaOverride: videoEntries.length > 0,
      partialMediaOverride: videoEntries.length > 0 && mediaPartialOverride([videoPrices.value?.price_480p, videoPrices.value?.price_720p, videoPrices.value?.price_1080p]),
    })
  }

  return sections
})
</script>
