<template>
  <article class="flex min-h-full flex-col rounded-lg border border-[var(--landing-border)] p-4 transition-colors hover:bg-[var(--landing-surface)]">
    <button type="button" class="flex items-start gap-3 text-left" @click="emit('open', model.name)"><div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-surface-strong)] font-mono text-sm text-[var(--landing-fg)]">{{ model.name.charAt(0).toUpperCase() }}</div><div class="min-w-0 flex-1"><div class="flex items-center gap-2"><h2 class="truncate font-mono text-sm font-medium text-[var(--landing-fg)]">{{ model.name }}</h2></div><p class="mt-0.5 text-xs text-[var(--landing-fg-soft)]">{{ model.providers.map((provider) => provider.name).join(', ') || t('Token-based') }}</p></div></button>
    <p class="mt-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-[var(--landing-fg-soft)]">{{ model.platform_default_inbound_endpoints?.join(' · ') || t('No description available.') }}</p>
    <div class="mt-5 grid grid-cols-2 gap-4 border-y border-[var(--landing-border)] py-4"><div><p class="text-xs text-[var(--landing-fg-soft)]">{{ t('Input') }}</p><p class="mt-1 truncate text-sm font-semibold tabular-nums text-[var(--landing-fg)]">{{ modelPrice(model, 'input_price', unit) }}<span class="ml-1 text-xs font-normal text-[var(--landing-fg-soft)]">/ {{ unit }}{{ t('tokens') }}</span></p></div><div><p class="text-xs text-[var(--landing-fg-soft)]">{{ t('Output') }}</p><p class="mt-1 truncate text-sm font-semibold tabular-nums text-[var(--landing-fg)]">{{ modelPrice(model, 'output_price', unit) }}<span class="ml-1 text-xs font-normal text-[var(--landing-fg-soft)]">/ {{ unit }}{{ t('tokens') }}</span></p></div></div>
    <div class="mt-4 flex flex-1 flex-col justify-end gap-4"><div class="flex min-h-6 flex-wrap items-center gap-1.5"><span v-for="group in modelGroups(model).slice(0, 3)" :key="group" class="rounded-md bg-[var(--landing-surface-strong)] px-2 py-1 text-xs text-[var(--landing-fg-soft)]">{{ group }}</span></div><button type="button" class="self-start rounded-md px-2 py-1.5 text-sm text-[var(--landing-fg-soft)] hover:bg-[var(--landing-surface-strong)] hover:text-[var(--landing-fg)]" @click="emit('open', model.name)">{{ t('Details') }} →</button></div>
  </article>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PublicMarketplaceModel } from '@/api/pricing'
import { modelGroups, modelPrice } from './pricingPresentation'
defineProps<{ model: PublicMarketplaceModel; unit: 'M' | 'K' }>()
const emit = defineEmits<{ open: [name: string] }>()
const { t } = useI18n()
</script>
