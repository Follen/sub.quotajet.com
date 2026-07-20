<template>
  <div class="space-y-8">
    <template v-if="activeSection === 'overview'">
      <section v-if="baseEntry">
        <h2 class="pricing-section-title">{{ t('Pricing') }}</h2>
        <div class="overflow-hidden rounded-xl border border-pricing">
          <div class="flex items-baseline justify-between gap-3 border-b border-pricing px-4 py-3">
            <span class="text-sm font-medium">{{ baseEntry.price?.billing_mode === 'token' ? t('Text tokens') : t('Request') }}</span>
            <span data-testid="pricing-detail-base-unit" class="text-xs text-pricing-muted">{{ basePriceUnitLabel }}</span>
          </div>
          <div class="divide-y divide-pricing">
            <div
              v-for="row in basePriceRows"
              :key="row.label"
              :data-testid="row.testId"
              class="flex items-baseline justify-between gap-4 px-4 py-3"
            >
              <span class="text-sm text-pricing-muted">{{ row.label }}</span>
              <span class="text-sm font-medium tabular-nums">{{ row.value }}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="pricing-section-title">{{ t('Pricing by Group') }}</h2>
        <div v-if="publicGroups.length" class="overflow-hidden rounded-xl border border-pricing">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr class="border-b border-pricing">
                  <th class="pricing-detail-th">{{ t('Provider') }}</th>
                  <th class="pricing-detail-th">{{ t('Group') }}</th>
                  <th class="pricing-detail-th">{{ t('Ratio') }}</th>
                  <th class="pricing-detail-th text-right">{{ t('Input') }}</th>
                  <th class="pricing-detail-th text-right">{{ t('availableChannels.pricing.imageInputPrice') }}</th>
                  <th class="pricing-detail-th text-right">{{ t('Output') }}</th>
                  <th class="pricing-detail-th text-right">{{ t('Cached input') }}</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="entry in publicGroups" :key="`${entry.providerName}:${entry.group.name}`">
                  <tr :data-testid="`pricing-detail-group-${entry.group.name}`" class="border-b border-pricing last:border-b-0">
                    <td class="px-4 py-3 text-pricing-muted">{{ formatPlatformName(entry.providerName) }}</td>
                    <td class="px-4 py-3"><span class="pricing-group-badge">{{ entry.group.name }}</span></td>
                    <td class="px-4 py-3 font-mono text-pricing-muted">x{{ entry.group.rate_multiplier }}</td>
                    <td class="px-4 py-3 text-right font-mono">{{ effectivePrice(entry, 'input_price') }}</td>
                    <td data-price="image-input" class="px-4 py-3 text-right font-mono">{{ effectivePrice(entry, 'image_input_price') }}</td>
                    <td class="px-4 py-3 text-right font-mono">{{ effectivePrice(entry, 'output_price') }}</td>
                    <td class="px-4 py-3 text-right font-mono">{{ effectivePrice(entry, 'cache_read_price') }}</td>
                  </tr>
                  <tr v-if="entry.price?.intervals.length" class="border-b border-pricing last:border-b-0">
                    <td colspan="7" class="p-3">
                      <PricingTierTable
                        :intervals="entry.price.intervals"
                        :rate-multiplier="entry.group.rate_multiplier"
                        :billing-mode="entry.price.billing_mode || 'token'"
                      />
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <p data-testid="pricing-detail-group-unit" class="border-t border-pricing px-4 py-2 text-xs text-pricing-muted">{{ groupPriceUnitLabel }}</p>
        </div>
        <p v-else class="text-sm text-pricing-muted">{{ t('This model is not available in any public group.') }}</p>
      </section>

      <section v-if="mediaPriceRows.length">
        <h2 class="pricing-section-title">{{ t('Media pricing') }}</h2>
        <div class="overflow-hidden rounded-xl border border-pricing">
          <div v-for="row in mediaPriceRows" :key="row.label" class="flex items-baseline justify-between gap-4 border-b border-pricing px-4 py-3 last:border-b-0">
            <span class="text-sm text-pricing-muted">{{ row.label }}</span>
            <span class="text-sm font-mono">{{ row.value }}</span>
          </div>
        </div>
      </section>

      <section v-if="capabilityLabels.length">
        <h2 class="pricing-section-title">{{ t('Capabilities') }}</h2>
        <div class="flex flex-wrap gap-1.5 rounded-xl border border-pricing p-4">
          <span v-for="capability in capabilityLabels" :key="capability" class="pricing-badge">{{ capability }}</span>
        </div>
      </section>

      <section>
        <h2 class="pricing-section-title">{{ t('Model') }}</h2>
        <div class="grid grid-cols-1 overflow-hidden rounded-xl border border-pricing sm:grid-cols-2">
          <div v-for="cell in modelCells" :key="cell.label" class="border-b border-pricing px-4 py-3 odd:sm:border-r">
            <p class="text-xs font-medium text-pricing-muted">{{ cell.label }}</p>
            <div class="mt-1.5 flex min-w-0 flex-wrap gap-1.5 text-sm font-medium">
              <span v-for="value in cell.values" :key="value" :class="cell.badges ? 'pricing-badge' : ''">{{ value }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <template v-else>
      <section>
        <h2 class="pricing-section-title">{{ t('API endpoints') }}</h2>
        <div class="overflow-hidden rounded-xl border border-pricing">
          <div v-for="endpoint in modelEndpoints(model)" :key="endpoint" class="flex items-center justify-between gap-4 border-b border-pricing px-4 py-3 last:border-b-0">
            <code class="font-mono text-sm">{{ endpoint }}</code>
            <span class="pricing-badge">POST</span>
          </div>
        </div>
      </section>
      <PricingQuickStart :api-origin="apiOrigin" :model-name="model.name" :endpoint="modelEndpoints(model)[0]" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PublicGroupPriceEntry, PricingCatalogueModel, PriceField, TokenUnit } from './pricingPresentation'
import PricingQuickStart from './PricingQuickStart.vue'
import PricingTierTable from './PricingTierTable.vue'
import {
  formatCurrency,
  formatModelFixedPrice,
  formatPlatformName,
  groupPriceEntries,
  modelBillingMode,
  modelEndpoints,
  modelGroups,
} from './pricingPresentation'
import type { PricingDetailSection } from './PricingDetailNav.vue'

const props = defineProps<{
  activeSection: PricingDetailSection
  model: PricingCatalogueModel
  unit: TokenUnit
  apiOrigin: string
}>()
const { t } = useI18n()

const scale = computed(() => props.unit === 'M' ? 1_000_000 : 1_000)
const baseEntry = computed(() => groupPriceEntries(props.model).find((entry) => entry.price))
const publicGroups = computed(() => groupPriceEntries(props.model)
  .filter((entry) => entry.price)
  .sort((left, right) => `${left.group.name}:${left.providerName}`.localeCompare(`${right.group.name}:${right.providerName}`)))

const tokenPriceUnitLabel = computed(() => `${t('Prices shown per')} ${props.unit === 'M' ? '1M' : '1K'} ${t('tokens')}`)
const mixedPriceUnitLabel = computed(() => `${t('Prices shown per request')} · ${props.unit === 'M' ? '1M' : '1K'} ${t('tokens')}`)
const basePriceUnitLabel = computed(() => {
  if ((baseEntry.value?.price?.billing_mode || 'token') === 'token') return tokenPriceUnitLabel.value
  if (typeof baseEntry.value?.price?.image_input_price === 'number') {
    return mixedPriceUnitLabel.value
  }
  return t('Prices shown per request')
})
const groupPriceUnitLabel = computed(() => {
  const hasRequestPrice = publicGroups.value.some((entry) => (entry.price?.billing_mode || 'token') !== 'token')
  const hasTokenPrice = publicGroups.value.some((entry) =>
    (entry.price?.billing_mode || 'token') === 'token' || typeof entry.price?.image_input_price === 'number',
  )
  if (hasRequestPrice && hasTokenPrice) return mixedPriceUnitLabel.value
  return hasTokenPrice ? tokenPriceUnitLabel.value : t('Prices shown per request')
})

const basePriceRows = computed(() => {
  const price = baseEntry.value?.price
  if (!price) return []
  if ((price.billing_mode || 'token') !== 'token') {
    const rows: Array<{ label: string; value: string; testId?: string }> = [
      { label: t('Price'), value: formatModelFixedPrice(props.model) },
    ]
    if (typeof price.image_input_price === 'number') {
      rows.push({
        label: t('availableChannels.pricing.imageInputPrice'),
        value: formatCurrency(price.image_input_price * scale.value),
        testId: 'pricing-detail-base-image-input',
      })
    }
    return rows
  }
  const fields: Array<{ label: string; field: PriceField }> = [
    { label: t('Input'), field: 'input_price' },
    { label: t('availableChannels.pricing.imageInputPrice'), field: 'image_input_price' },
    { label: t('Output'), field: 'output_price' },
    { label: t('Cached input'), field: 'cache_read_price' },
    { label: t('Cache write'), field: 'cache_write_price' },
  ]
  return fields
    .filter(({ field }) => typeof price[field] === 'number')
    .map(({ label, field }) => ({
      label,
      value: formatCurrency((price[field] as number) * scale.value),
      testId: field === 'image_input_price' ? 'pricing-detail-base-image-input' : undefined,
    }))
})

const capabilityLabels = computed(() => {
  if (!props.model.capabilities) return []
  return Object.entries(props.model.capabilities)
    .filter(([name, enabled]) => enabled && name !== 'providers' && name !== 'pricing')
    .map(([name]) => name.replace(/_/g, ' '))
})

const modelCells = computed(() => [
  { label: t('Provider'), values: [formatPlatformName(props.model.platform)], badges: false },
  { label: t('Type'), values: [modelBillingMode(props.model) === 'token' ? t('Token-based') : t('Per Request')], badges: false },
  { label: t('Groups'), values: modelGroups(props.model), badges: true },
  { label: t('Endpoints'), values: modelEndpoints(props.model), badges: true },
])

const mediaPriceRows = computed(() => {
  const rows: Array<{ label: string; value: string }> = []
  for (const entry of publicGroups.value) {
    const group = entry.group
    const prefix = `${group.name} · ${formatPlatformName(entry.providerName)}`
    if (group.image_prices) {
      for (const [size, value] of Object.entries(group.image_prices)) {
        if (typeof value === 'number') rows.push({ label: `${prefix} · ${t('Image')} ${size.replace('price_', '')}`, value: formatCurrency(value * (group.image_rate_multiplier || group.rate_multiplier)) })
      }
    }
    if (group.video_prices) {
      for (const [resolution, value] of Object.entries(group.video_prices)) {
        if (typeof value === 'number') rows.push({ label: `${prefix} · ${t('Video')} ${resolution.replace('price_', '')}`, value: formatCurrency(value * (group.video_rate_multiplier || group.rate_multiplier)) })
      }
    }
    if (entry.price?.per_request_price != null && entry.price.billing_mode !== 'token') {
      rows.push({ label: `${prefix} · ${t('Per request')}`, value: formatCurrency(entry.price.per_request_price * group.rate_multiplier) })
    }
  }
  return rows
})

function effectivePrice(entry: PublicGroupPriceEntry, field: PriceField): string {
  if (field === 'image_input_price') {
    const imageInputPrice = entry.price?.image_input_price
    if (typeof imageInputPrice !== 'number') return '—'
    return formatCurrency(imageInputPrice * entry.group.rate_multiplier * scale.value)
  }
  if ((entry.price?.billing_mode || 'token') !== 'token') {
    return field === 'input_price' ? formatModelFixedPrice(props.model, entry.group.name) : '—'
  }
  const value = entry.price?.[field]
  if (typeof value !== 'number') return '—'
  return formatCurrency(value * entry.group.rate_multiplier * scale.value)
}
</script>
