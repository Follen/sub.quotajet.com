<template>
  <section class="min-w-0">
    <div v-if="model.supported_inbound_endpoints?.length || model.capabilities" class="mb-5 space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <div v-if="model.supported_inbound_endpoints?.length" data-testid="marketplace-supported-endpoints">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ t('modelMarketplace.endpoints.title') }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span v-for="endpoint in model.supported_inbound_endpoints" :key="endpoint" class="rounded border border-slate-700 px-2 py-1 font-mono text-[11px] text-slate-300">
            {{ endpoint }}
          </span>
        </div>
      </div>
      <div v-if="model.capabilities" data-testid="marketplace-capabilities">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ t('modelMarketplace.capabilities.title') }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span v-if="model.capabilities.providers" class="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300">{{ t('modelMarketplace.capabilities.providers') }}</span>
          <span v-if="model.capabilities.image_generation" class="rounded border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[11px] text-lime-200">{{ t('modelMarketplace.capabilities.imageGeneration') }}</span>
          <span v-if="model.capabilities.video_generation" class="rounded border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[11px] text-lime-200">{{ t('modelMarketplace.capabilities.videoGeneration') }}</span>
          <span v-if="model.capabilities.pricing" class="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300">{{ t('modelMarketplace.capabilities.pricing') }}</span>
        </div>
      </div>
    </div>

    <div v-if="activeSection === 'providers'" class="space-y-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ t('modelMarketplace.sections.providers.title') }}</p>
        <h3 class="mt-1 text-lg font-semibold text-white">{{ t('modelMarketplace.sections.providers.heading') }}</h3>
      </div>
      <article v-for="provider in model.providers" :key="provider.name" :data-testid="`marketplace-provider-${provider.name}`" class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
        <h4 class="font-mono text-sm font-medium text-slate-100">{{ provider.name }}</h4>
        <p v-if="provider.description" class="mt-1 text-sm text-slate-400">{{ provider.description }}</p>
        <div class="mt-4 space-y-3">
          <div v-for="groupPrice in provider.group_prices" :key="`${provider.name}-${groupPrice.name}`" :data-testid="`marketplace-group-${groupPrice.name}`">
            <MarketplacePricingPanel :group-price="groupPrice" />
          </div>
        </div>
      </article>
      <p v-if="model.providers.length === 0" class="rounded-lg border border-dashed border-slate-700 p-5 text-sm text-slate-500">
        {{ t('modelMarketplace.sections.providers.empty') }}
      </p>
    </div>

    <div v-else-if="activeSection === 'pricing'" class="space-y-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ t('modelMarketplace.sections.pricing.title') }}</p>
        <h3 class="mt-1 text-lg font-semibold text-white">{{ t('modelMarketplace.sections.pricing.heading') }}</h3>
      </div>
      <template v-for="provider in model.providers" :key="provider.name">
        <div v-for="groupPrice in provider.group_prices" :key="`${provider.name}-${groupPrice.name}`">
          <p class="mb-2 font-mono text-xs text-slate-500">{{ provider.name }}</p>
          <MarketplacePricingPanel :group-price="groupPrice" />
        </div>
      </template>
    </div>

    <div v-else :data-testid="`marketplace-section-empty-${activeSection}`" class="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
      <p class="text-sm font-medium text-slate-200">{{ t(`modelMarketplace.sections.${activeSection}.title`) }}</p>
      <p class="mt-2 text-sm text-slate-500">{{ t(`modelMarketplace.sections.${activeSection}.empty`) }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { PublicMarketplaceModel } from '@/api/modelMarketplace'
import MarketplacePricingPanel from './MarketplacePricingPanel.vue'

type DetailSection = 'providers' | 'pricing' | 'performance' | 'uptime' | 'benchmarks' | 'apps' | 'activity'

defineProps<{
  activeSection: DetailSection
  model: PublicMarketplaceModel
}>()

const { t } = useI18n()
</script>
