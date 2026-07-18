<template>
  <section data-testid="pricing-shell" class="pricing-page-shell mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <header class="mb-8 space-y-6">
      <div class="max-w-3xl">
        <h1 class="text-lg font-semibold tracking-tight">{{ t('Models & pricing') }}</h1>
        <p class="mt-2 text-sm leading-relaxed text-pricing-muted">
          {{ t('Discover curated AI models, compare pricing and capabilities, and choose the right model for every scenario.') }}
          {{ t('modelMarketplace.modelsEnabled', { count: models.length }) }}
        </p>
      </div>
    </header>

    <div v-if="loading" data-testid="marketplace-loading" class="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
      <div class="hidden h-[560px] animate-pulse rounded-[10px] bg-pricing-muted xl:block" />
      <div class="space-y-4">
        <div class="flex justify-between gap-3"><div class="h-8 w-96 animate-pulse rounded-[10px] bg-pricing-muted" /><div class="h-8 w-80 animate-pulse rounded-[10px] bg-pricing-muted" /></div>
        <div class="h-5 w-28 animate-pulse rounded bg-pricing-muted" />
        <div class="h-[530px] animate-pulse rounded-[10px] border border-pricing bg-pricing-muted" />
      </div>
    </div>

    <div v-else-if="errorMessage" data-testid="marketplace-error" class="rounded-[10px] border border-red-500/30 bg-red-500/10 p-6">
      <h2 class="font-medium text-red-400">{{ t('modelMarketplace.error.title') }}</h2>
      <p class="mt-1 text-sm text-red-300">{{ errorMessage }}</p>
      <button type="button" class="pricing-control-button mt-4" @click="emit('retry')">{{ t('modelMarketplace.error.retry') }}</button>
    </div>

    <div v-else-if="models.length === 0" data-testid="marketplace-empty" class="rounded-[10px] border border-dashed border-pricing p-12 text-center">
      <h2 class="text-base font-semibold">{{ t('modelMarketplace.empty.title') }}</h2>
      <p class="mt-2 text-sm text-pricing-muted">{{ t('modelMarketplace.empty.description') }}</p>
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
      <PricingSidebarMain
        :models="models"
        :vendors="vendors"
        :vendor="vendorFilter"
        :endpoint="endpointFilter"
        :quota="quotaFilter"
        :group="groupFilter"
        :tag="tagFilter"
        @update:vendor="vendorFilter = $event"
        @update:endpoint="endpointFilter = $event"
        @update:quota="quotaFilter = $event"
        @update:group="groupFilter = $event"
        @update:tag="tagFilter = $event"
        @reset="resetFilters"
      />

      <main class="min-w-0 space-y-4">
        <PricingToolbarMain
          v-model:search="search"
          v-model:sort="sort"
          v-model:unit="unit"
          v-model:view="view"
          :filtered-count="filteredModels.length"
          :total-count="models.length"
          :active-filter-count="activeFilterCount"
          @open-filters="mobileFiltersOpen = true"
        />

        <PricingModelTableMain
          v-if="view === 'table'"
          :models="filteredModels"
          :unit="unit"
          :selected-group="groupFilter"
          @open="openModel"
        />
        <div v-else-if="filteredModels.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PricingModelCardMain
            v-for="model in filteredModels"
            :key="`${model.platform}:${model.name}`"
            :model="model"
            :unit="unit"
            :selected-group="groupFilter"
            @open="openModel"
          />
        </div>
        <div v-else class="rounded-[10px] border border-dashed border-pricing p-12 text-center">
          <p class="text-sm font-medium">{{ t('No Models Found') }}</p>
          <p class="mt-2 text-sm text-pricing-muted">{{ t('No models match your current filters.') }}</p>
          <button type="button" class="pricing-control-button mt-4" @click="clearAll">{{ t('Clear filters') }}</button>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div v-if="mobileFiltersOpen" class="fixed inset-0 z-[70] xl:hidden">
        <button type="button" class="absolute inset-0 bg-black/60" :aria-label="t('Close')" @click="mobileFiltersOpen = false" />
        <div class="pricing-mobile-drawer absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-pricing p-5 shadow-2xl">
          <div class="mb-4 flex items-center justify-between">
            <div><h2 class="font-semibold">{{ t('Filter') }}</h2><p class="mt-1 text-sm text-pricing-muted">{{ t('Filter models by provider, group, type, endpoint, and tags.') }}</p></div>
            <button type="button" class="pricing-icon-button" :aria-label="t('Close')" @click="mobileFiltersOpen = false"><Icon name="x" /></button>
          </div>
          <PricingSidebarMain
            mobile
            :models="models"
            :vendors="vendors"
            :vendor="vendorFilter"
            :endpoint="endpointFilter"
            :quota="quotaFilter"
            :group="groupFilter"
            :tag="tagFilter"
            @update:vendor="vendorFilter = $event"
            @update:endpoint="endpointFilter = $event"
            @update:quota="quotaFilter = $event"
            @update:group="groupFilter = $event"
            @update:tag="tagFilter = $event"
            @reset="resetFilters"
          />
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { PublicPricingCatalogue } from '@/api/pricing'
import Icon from '@/components/icons/Icon.vue'
import PricingModelCardMain from './PricingModelCardMain.vue'
import PricingModelTableMain from './PricingModelTableMain.vue'
import PricingSidebarMain from './PricingSidebarMain.vue'
import PricingToolbarMain from './PricingToolbarMain.vue'
import {
  catalogueModels,
  modelBillingMode,
  modelEndpoints,
  modelGroups,
  modelPriceValue,
  modelSearchText,
  modelTags,
  platformOptions,
  type PricingCatalogueModel,
  type TokenUnit,
} from './pricingPresentation'

const props = withDefaults(defineProps<{
  marketplace?: PublicPricingCatalogue | null
  loading?: boolean
  errorMessage?: string
  apiOrigin?: string
}>(), { marketplace: null, loading: false, errorMessage: '', apiOrigin: '' })
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
const router = useRouter()

const search = ref('')
const sort = ref('name')
const unit = ref<TokenUnit>('M')
const view = ref<'card' | 'table'>('table')
const vendorFilter = ref('')
const endpointFilter = ref('')
const quotaFilter = ref('')
const groupFilter = ref('')
const tagFilter = ref('')
const mobileFiltersOpen = ref(false)

const models = computed(() => catalogueModels(props.marketplace))
const vendors = computed(() => platformOptions(models.value))
const activeFilterCount = computed(() =>
  [vendorFilter, endpointFilter, quotaFilter, groupFilter, tagFilter].filter((item) => item.value).length,
)

const filteredModels = computed(() => {
  const query = search.value.trim().toLowerCase()
  const filtered = models.value.filter((model) => {
    if (vendorFilter.value && model.platform !== vendorFilter.value) return false
    if (endpointFilter.value && !modelEndpoints(model).includes(endpointFilter.value)) return false
    if (quotaFilter.value === 'token' && modelBillingMode(model) !== 'token') return false
    if (quotaFilter.value === 'request' && modelBillingMode(model) === 'token') return false
    if (groupFilter.value && !modelGroups(model).includes(groupFilter.value)) return false
    if (tagFilter.value && !modelTags(model).includes(tagFilter.value)) return false
    return !query || modelSearchText(model).includes(query)
  })

  return [...filtered].sort((left, right) => {
    if (sort.value === 'price-low' || sort.value === 'price-high') {
      const leftPrice = modelPriceValue(left, 'input_price', unit.value, groupFilter.value) ?? Number.POSITIVE_INFINITY
      const rightPrice = modelPriceValue(right, 'input_price', unit.value, groupFilter.value) ?? Number.POSITIVE_INFINITY
      const direction = sort.value === 'price-low' ? 1 : -1
      if (leftPrice !== rightPrice) return (leftPrice - rightPrice) * direction
    }
    return left.name.localeCompare(right.name)
  })
})

function resetFilters() {
  vendorFilter.value = ''
  endpointFilter.value = ''
  quotaFilter.value = ''
  groupFilter.value = ''
  tagFilter.value = ''
}

function clearAll() {
  resetFilters()
  search.value = ''
}

async function openModel(model: PricingCatalogueModel) {
  await router.push({
    name: 'PricingModel',
    params: { modelId: model.name },
    query: {
      tokenUnit: unit.value,
      platform: model.platform,
      ...(groupFilter.value ? { group: groupFilter.value } : {}),
    },
  })
}
</script>
