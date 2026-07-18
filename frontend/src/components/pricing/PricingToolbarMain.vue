<template>
  <div data-testid="pricing-toolbar">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label class="pricing-search relative block w-full sm:max-w-sm">
        <Icon name="search" size="sm" class="pointer-events-none absolute left-2.5 top-2 text-pricing-muted" />
        <input
          ref="searchInput"
          data-testid="pricing-search"
          :value="search"
          type="search"
          :placeholder="t('Search model name, provider, endpoint, or tag...')"
          class="h-8 w-full rounded-[10px] border border-pricing bg-pricing-input py-1 pl-8 pr-14 text-sm outline-none placeholder:text-pricing-muted focus:border-pricing-strong"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        />
        <kbd class="pointer-events-none absolute right-2 top-1.5 rounded border border-pricing px-1.5 text-[10px] leading-5 text-pricing-muted">Ctrl K</kbd>
      </label>

      <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
        <button type="button" class="pricing-control-button" @click="emit('openFilters')">
          <Icon name="filter" size="xs" />
          {{ t('Filter') }}
          <span v-if="activeFilterCount" class="pricing-control-count">{{ activeFilterCount }}</span>
        </button>

        <label class="pricing-select-control">
          <Icon name="arrowsUpDown" size="xs" />
          <select
            :value="sort"
            :aria-label="t('Sort')"
            @change="emit('update:sort', ($event.target as HTMLSelectElement).value)"
          >
            <option value="name">{{ t('Name') }}</option>
            <option value="price-low">{{ t('Price: Low to High') }}</option>
            <option value="price-high">{{ t('Price: High to Low') }}</option>
          </select>
        </label>

        <div class="pricing-tabs" :aria-label="t('Token unit')">
          <button type="button" :class="unit === 'M' ? 'is-active' : ''" @click="emit('update:unit', 'M')">1M</button>
          <button type="button" :class="unit === 'K' ? 'is-active' : ''" @click="emit('update:unit', 'K')">1K</button>
        </div>

        <div class="pricing-tabs" :aria-label="t('View mode')">
          <button type="button" :class="view === 'table' ? 'is-active' : ''" :aria-label="t('Table view')" @click="emit('update:view', 'table')">
            <Icon name="menu" size="xs" />
          </button>
          <button type="button" :class="view === 'card' ? 'is-active' : ''" :aria-label="t('Card view')" @click="emit('update:view', 'card')">
            <Icon name="grid" size="xs" />
          </button>
        </div>
      </div>
    </div>

    <p class="mt-3 text-sm text-pricing-muted">
      <span class="font-medium tabular-nums text-pricing">{{ filteredCount.toLocaleString() }}</span>
      {{ filteredCount === 1 ? t('model') : t('models') }}
      <span v-if="filteredCount !== totalCount"> {{ t('of') }} {{ totalCount.toLocaleString() }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import type { TokenUnit } from './pricingPresentation'

defineProps<{
  search: string
  sort: string
  unit: TokenUnit
  view: 'card' | 'table'
  filteredCount: number
  totalCount: number
  activeFilterCount: number
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:sort': [value: string]
  'update:unit': [value: TokenUnit]
  'update:view': [value: 'card' | 'table']
  openFilters: []
}>()

const { t } = useI18n()
const searchInput = ref<HTMLInputElement | null>(null)

function handleShortcut(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
  event.preventDefault()
  searchInput.value?.focus()
}

onMounted(() => window.addEventListener('keydown', handleShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleShortcut))
</script>
