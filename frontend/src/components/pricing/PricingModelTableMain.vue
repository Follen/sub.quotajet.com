<template>
  <div class="space-y-4">
    <div class="overflow-x-auto rounded-lg border border-[var(--landing-border)]"><table class="w-full min-w-[980px] text-left text-sm"><thead class="border-b border-[var(--landing-border)]"><tr><th v-for="heading in headings" :key="heading" class="px-4 py-3 text-xs font-medium text-[var(--landing-fg-soft)]" :class="heading === t('Input') || heading === t('Cached input') || heading === t('Output') ? 'text-right' : ''">{{ heading }}</th></tr></thead><tbody><tr v-for="model in models" :key="model.name" tabindex="0" class="cursor-pointer border-b border-[var(--landing-border)] last:border-0 hover:bg-[var(--landing-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-fg)]/30" @click="emit('open', model.name)" @keydown.enter="emit('open', model.name)"><td class="px-4 py-3"><div class="flex min-w-[240px] items-start gap-3"><div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--landing-surface-strong)] font-mono text-xs text-[var(--landing-fg)]">{{ model.name.charAt(0).toUpperCase() }}</div><div class="min-w-0"><p class="truncate font-mono text-sm font-medium text-[var(--landing-fg)]">{{ model.name }}</p><p class="mt-0.5 line-clamp-1 text-xs text-[var(--landing-fg-soft)]">{{ model.providers.map((provider) => provider.name).join(', ') || (modelBillingMode(model) === 'token' ? t('Token-based') : t('Per Request')) }}</p></div></div></td><td class="px-4 py-3 text-right font-mono text-xs text-[var(--landing-fg)]">{{ modelPrice(model, 'input_price', unit) }}<span class="mt-0.5 block text-[11px] text-[var(--landing-fg-soft)]">/ {{ unit }} {{ t('tokens') }}</span></td><td class="px-4 py-3 text-right font-mono text-xs text-[var(--landing-fg)]">{{ modelPrice(model, 'cache_read_price', unit) }}</td><td class="px-4 py-3 text-right font-mono text-xs text-[var(--landing-fg)]">{{ modelPrice(model, 'output_price', unit) }}<span class="mt-0.5 block text-[11px] text-[var(--landing-fg-soft)]">/ {{ unit }} {{ t('tokens') }}</span></td><td class="px-4 py-3 text-xs text-[var(--landing-fg-soft)]">—</td><td class="px-4 py-3 text-xs text-[var(--landing-fg-soft)]">{{ modelEndpoints(model).join(', ') || '—' }}</td><td class="px-4 py-3 text-xs text-[var(--landing-fg-soft)]">{{ modelGroups(model).join(', ') || '—' }}</td></tr></tbody></table></div>
    <div v-if="models.length === 0" class="rounded-lg border border-dashed border-[var(--landing-border)] p-12 text-center"><p class="text-sm font-medium text-[var(--landing-fg)]">{{ t('No Models Found') }}</p><p class="mt-2 text-sm text-[var(--landing-fg-soft)]">{{ t('No models match your current filters.') }}</p></div>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PublicMarketplaceModel } from '@/api/pricing'
import { modelBillingMode, modelEndpoints, modelGroups, modelPrice } from './pricingPresentation'
defineProps<{ models: PublicMarketplaceModel[]; unit: 'M' | 'K' }>()
const emit = defineEmits<{ open: [name: string] }>()
const { t } = useI18n()
const headings = [t('Model'), t('Input'), t('Cached input'), t('Output'), t('Health'), t('Endpoints'), t('Groups')]
</script>

