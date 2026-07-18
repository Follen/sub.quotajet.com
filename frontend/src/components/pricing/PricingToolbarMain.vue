<template>
  <div>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative w-full sm:max-w-sm"><input :value="search" type="search" :placeholder="t('Search model name, provider, endpoint, or tag...')" class="w-full rounded-md border border-[var(--landing-border)] bg-transparent px-3 py-2 text-sm text-[var(--landing-fg)] outline-none placeholder:text-[var(--landing-fg-muted)] focus:border-[var(--landing-fg)]/40" @input="emit('update:search', ($event.target as HTMLInputElement).value)" /></div>
      <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
        <button type="button" class="rounded-md border border-[var(--landing-border)] px-2.5 py-2 text-xs text-[var(--landing-fg-soft)]">⌕ {{ t('Filter') }}</button>
        <select :value="sort" class="rounded-md border border-[var(--landing-border)] bg-transparent px-2.5 py-2 text-xs text-[var(--landing-fg-soft)]" @change="emit('update:sort', ($event.target as HTMLSelectElement).value)"><option value="name">↕ {{ t('Name') }}</option><option value="price">↕ {{ t('Price') }}</option></select>
        <div class="flex rounded-md border border-[var(--landing-border)] p-0.5"><button type="button" class="rounded px-2 py-1.5 text-xs" :class="!recharge ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="emit('update:recharge', false)">{{ t('Standard') }}</button><button type="button" class="rounded px-2 py-1.5 text-xs" :class="recharge ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="emit('update:recharge', true)">{{ t('Recharge') }}</button></div>
        <div class="flex rounded-md border border-[var(--landing-border)] p-0.5"><button type="button" class="rounded px-2 py-1.5 text-xs" :class="unit === 'M' ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="emit('update:unit', 'M')">1M</button><button type="button" class="rounded px-2 py-1.5 text-xs" :class="unit === 'K' ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="emit('update:unit', 'K')">1K</button></div>
        <div class="flex rounded-md border border-[var(--landing-border)] p-0.5"><button type="button" aria-label="Table view" class="rounded px-2 py-1.5 text-xs" :class="view === 'table' ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="emit('update:view', 'table')">▤</button><button type="button" aria-label="Card view" class="rounded px-2 py-1.5 text-xs" :class="view === 'card' ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="emit('update:view', 'card')">▦</button></div>
      </div>
    </div>
    <p class="mt-3 text-sm text-[var(--landing-fg-soft)]"><span class="font-medium tabular-nums text-[var(--landing-fg)]">{{ filteredCount.toLocaleString() }}</span> {{ filteredCount === 1 ? t('model') : t('models') }}<span v-if="totalCount !== filteredCount"> {{ t('of') }} {{ totalCount.toLocaleString() }}</span></p>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps<{ search: string; sort: string; recharge: boolean; unit: 'M' | 'K'; view: 'card' | 'table'; filteredCount: number; totalCount: number }>()
const emit = defineEmits<{ 'update:search': [value: string]; 'update:sort': [value: string]; 'update:recharge': [value: boolean]; 'update:unit': [value: 'M' | 'K']; 'update:view': [value: 'card' | 'table'] }>()
const { t } = useI18n()
</script>
