<template>
  <aside class="rounded-lg border border-[var(--landing-border)] p-3">
    <div class="mb-2 flex items-center justify-between gap-2">
      <p class="text-xs text-[var(--landing-fg-soft)]">{{ hasFilters ? t('Filters active') : t('Refine models by provider, group, type, and tags.') }}</p>
      <button type="button" class="rounded-md px-2 py-1 text-xs text-[var(--landing-fg-soft)] transition hover:bg-[var(--landing-surface)] hover:text-[var(--landing-fg)]" :disabled="!hasFilters" @click="emit('reset')">↻ {{ t('Reset') }}</button>
    </div>
    <div class="space-y-1">
      <section v-for="section in sections" :key="section.title" class="border-b border-[var(--landing-border)] pb-3 last:border-b-0">
        <button type="button" class="flex w-full items-center justify-between py-2.5 text-left text-sm font-medium text-[var(--landing-fg)]" @click="toggle(section.key)">{{ section.title }} <span class="text-[var(--landing-fg-soft)]">{{ openSections.has(section.key) ? '⌃' : '⌄' }}</span></button>
        <div v-if="openSections.has(section.key)" class="flex flex-wrap gap-1.5">
          <button v-for="option in section.options" :key="option.value" type="button" class="inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors" :class="isActive(section.key, option.value) ? 'border-[var(--landing-fg)]/30 bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'border-[var(--landing-border)] text-[var(--landing-fg-soft)] hover:bg-[var(--landing-surface)] hover:text-[var(--landing-fg)]'" @click="select(section.key, option.value)">{{ option.label }}<span v-if="option.count != null" class="rounded-md bg-[var(--landing-surface-strong)] px-1.5 py-0.5 tabular-nums">{{ option.count }}</span></button>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PublicMarketplaceModel } from '@/api/pricing'
import type { PricingVendorOption } from './pricingPresentation'
import { modelBillingMode, modelEndpoints, modelGroups } from './pricingPresentation'

type FilterKey = 'vendor' | 'endpoint' | 'quota' | 'group' | 'tag'
interface FilterOption { value: string; label: string; count?: number }
interface FilterSection { title: string; key: FilterKey; options: FilterOption[] }
interface Props { models: PublicMarketplaceModel[]; vendors: PricingVendorOption[]; vendor: string; endpoint: string; quota: string; group: string; tag: string }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:vendor': [value: string]; 'update:endpoint': [value: string]; 'update:quota': [value: string]; 'update:group': [value: string]; 'update:tag': [value: string]; reset: [] }>()
const { t } = useI18n()
const openSections = ref(new Set<FilterKey>(['vendor', 'endpoint', 'quota', 'group', 'tag']))
const unique = (values: string[]) => [...new Set(values)].sort()
const endpointValues = computed(() => unique(props.models.flatMap(modelEndpoints)))
const groupValues = computed(() => unique(props.models.flatMap(modelGroups)))
const tagValues = computed(() => unique(props.models.flatMap((model) => modelGroups(model).filter((group) => group.startsWith('#')))))
const sections = computed<FilterSection[]>(() => [
  { title: t('All Vendors'), key: 'vendor' as const, options: [{ value: '', label: t('All Vendors'), count: props.models.length }, ...props.vendors.map((vendor) => ({ value: vendor.name, label: vendor.name, count: vendor.count }))] },
  { title: t('Endpoint Type'), key: 'endpoint' as const, options: [{ value: '', label: t('All Types'), count: props.models.length }, ...endpointValues.value.map((value) => ({ value, label: value, count: props.models.filter((model) => modelEndpoints(model).includes(value)).length }))] },
  { title: t('Pricing Type'), key: 'quota' as const, options: [{ value: '', label: t('All Models'), count: props.models.length }, { value: 'token', label: t('Token-based'), count: props.models.filter((model) => modelBillingMode(model) === 'token').length }, { value: 'per_request', label: t('Per Request'), count: props.models.filter((model) => modelBillingMode(model) === 'per_request').length }] },
  { title: t('Groups'), key: 'group' as const, options: [{ value: '', label: t('All Groups') }, ...groupValues.value.map((value) => ({ value, label: value }))] },
  { title: t('Model Tags'), key: 'tag' as const, options: [{ value: '', label: t('All Tags'), count: props.models.length }, ...tagValues.value.map((value) => ({ value, label: value }))] },
])
const hasFilters = computed(() => Boolean(props.vendor || props.endpoint || props.quota || props.group || props.tag))
function toggle(key: FilterKey) { const next = new Set(openSections.value); next.has(key) ? next.delete(key) : next.add(key); openSections.value = next }
function isActive(key: FilterKey, value: string) { return props[key] === value }
function select(key: FilterKey, value: string) {
  if (key === 'vendor') emit('update:vendor', value)
  else if (key === 'endpoint') emit('update:endpoint', value)
  else if (key === 'quota') emit('update:quota', value)
  else if (key === 'group') emit('update:group', value)
  else emit('update:tag', value)
}
</script>
