<template>
  <section class="min-w-0">
    <div v-if="activeSection === 'providers'" class="space-y-8">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4"><div v-for="stat in stats" :key="stat.label" class="rounded-lg border border-[var(--landing-border)] p-3"><p class="text-xs text-[var(--landing-fg-soft)]">{{ stat.label }}</p><p class="mt-1 text-lg font-semibold tabular-nums text-[var(--landing-fg)]">{{ stat.value }}</p></div></div>
      <div v-if="model.platform_default_inbound_endpoints?.length || model.capabilities" class="space-y-3 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] p-4"><div v-if="model.platform_default_inbound_endpoints?.length"><p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-fg-soft)]">{{ t('Endpoints') }}</p><div class="mt-2 flex flex-wrap gap-2"><span v-for="endpoint in model.platform_default_inbound_endpoints" :key="endpoint" class="rounded-md border border-[var(--landing-border)] px-2 py-1 font-mono text-[11px] text-[var(--landing-fg-soft)]">{{ endpoint }}</span></div></div><div v-if="model.capabilities"><p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-fg-soft)]">{{ t('Capabilities') }}</p><div class="mt-2 flex flex-wrap gap-2"><span v-for="capability in capabilityLabels" :key="capability" class="rounded-md border border-[var(--landing-border)] px-2 py-1 text-[11px] text-[var(--landing-fg-soft)]">{{ capability }}</span></div></div></div>
      <div class="space-y-4"><div><p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-fg-soft)]">{{ t('Overview') }}</p><h3 class="mt-1 text-lg font-semibold text-[var(--landing-fg)]">{{ t('Available public providers') }}</h3></div><article v-for="provider in model.providers" :key="provider.name" :data-testid="`marketplace-provider-${provider.name}`" class="rounded-lg border border-[var(--landing-border)] p-4"><h4 class="font-mono text-sm font-medium text-[var(--landing-fg)]">{{ provider.name }}</h4><p v-if="provider.description" class="mt-1 text-sm text-[var(--landing-fg-soft)]">{{ provider.description }}</p><div class="mt-4 space-y-3"><PricingPanel v-for="groupPrice in provider.group_prices" :key="`${provider.name}-${groupPrice.name}`" :group-price="groupPrice" /></div></article><p v-if="model.providers.length === 0" class="rounded-lg border border-dashed border-[var(--landing-border)] p-5 text-sm text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.sections.providers.empty') }}</p></div>
    </div>
    <div v-else-if="activeSection === 'pricing'" class="space-y-4"><div><p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-fg-soft)]">{{ t('Pricing') }}</p><h3 class="mt-1 text-lg font-semibold text-[var(--landing-fg)]">{{ t('Public group-default prices') }}</h3></div><template v-for="provider in model.providers" :key="provider.name"><div v-for="groupPrice in provider.group_prices" :key="`${provider.name}-${groupPrice.name}`"><p class="mb-2 font-mono text-xs text-[var(--landing-fg-soft)]">{{ provider.name }}</p><PricingPanel :group-price="groupPrice" /></div></template></div>
    <div v-else-if="activeSection !== 'apps'" :data-testid="`marketplace-section-empty-${activeSection}`" class="rounded-lg border border-dashed border-[var(--landing-border)] p-8 text-center"><p class="text-sm font-medium text-[var(--landing-fg)]">{{ t(`modelMarketplace.sections.${activeSection}.title`) }}</p><p class="mt-2 text-sm text-[var(--landing-fg-soft)]">{{ t(`modelMarketplace.sections.${activeSection}.empty`) }}</p></div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PublicMarketplaceModel } from '@/api/pricing'
import PricingPanel from './PricingPanel.vue'
type DetailSection = 'providers' | 'pricing' | 'performance' | 'uptime' | 'benchmarks' | 'apps' | 'activity'
const props = defineProps<{ activeSection: DetailSection; model: PublicMarketplaceModel }>()
const { t } = useI18n()
const groups = computed(() => [...new Set(props.model.providers.flatMap((provider) => provider.group_prices.map((group) => group.name)))])
const hasPricing = computed(() => props.model.providers.some((provider) => provider.group_prices.some((group) => group.price !== null)))
const stats = computed(() => [{ label: t('Providers'), value: props.model.providers.length }, { label: t('Groups'), value: groups.value.length }, { label: t('Endpoints'), value: props.model.platform_default_inbound_endpoints?.length ?? 0 }, { label: t('Pricing'), value: hasPricing.value ? t('Available') : t('Not configured') }])
const capabilityLabels = computed(() => { const capabilities = props.model.capabilities; if (!capabilities) return []; return Object.entries(capabilities).filter(([, enabled]) => enabled).map(([name]) => name.split('_').join(' ')) })
</script>
