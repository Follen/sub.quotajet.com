<template>
  <section class="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <header v-if="!modelId" class="mb-8 space-y-6"><div class="max-w-3xl"><h1 class="text-lg font-semibold tracking-tight text-[var(--landing-fg)]">{{ t('Models & pricing') }}</h1><p class="mt-2 text-sm leading-relaxed text-[var(--landing-fg-soft)]">{{ t('Discover curated AI models, compare pricing and capabilities, and choose the right model for every scenario.') }} {{ t('modelMarketplace.modelsEnabled', { count: modelCount }) }}</p></div></header>
    <div v-if="loading" data-testid="marketplace-loading" class="flex min-h-64 items-center justify-center gap-3"><LoadingSpinner /><span class="text-sm text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.loading') }}</span></div>
    <div v-else-if="errorMessage" data-testid="marketplace-error" class="rounded-lg border border-red-500/30 bg-red-500/10 p-6"><h2 class="font-medium text-red-300">{{ t('modelMarketplace.error.title') }}</h2><p class="mt-1 text-sm text-red-200">{{ errorMessage }}</p><button type="button" class="mt-4 rounded-md border border-[var(--landing-border)] px-3 py-2 text-sm" @click="emit('retry')">{{ t('modelMarketplace.error.retry') }}</button></div>
    <div v-else-if="models.length === 0" data-testid="marketplace-empty" class="rounded-lg border border-dashed border-[var(--landing-border)] p-12 text-center"><h2 class="text-lg font-medium text-[var(--landing-fg)]">{{ t('modelMarketplace.empty.title') }}</h2><p class="mt-2 text-sm text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.empty.description') }}</p></div>
    <div v-else class="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
      <PricingSidebarMain v-if="!modelId" :models="models" :vendors="vendors" :vendor="vendorFilter" :endpoint="endpointFilter" :quota="quotaFilter" :group="groupFilter" :tag="tagFilter" @update:vendor="vendorFilter = $event" @update:endpoint="endpointFilter = $event" @update:quota="quotaFilter = $event" @update:group="groupFilter = $event" @update:tag="tagFilter = $event" @reset="resetFilters" />
      <main class="min-w-0 space-y-4" :class="modelId ? 'xl:col-span-2' : ''">
        <PricingToolbarMain v-if="!modelId" :search="search" :sort="sort" :recharge="recharge" :unit="unit" :view="view" :filtered-count="filteredModels.length" :total-count="models.length" @update:search="search = $event" @update:sort="sort = $event" @update:recharge="recharge = $event" @update:unit="unit = $event" @update:view="view = $event" />
        <template v-if="!modelId"><PricingModelTableMain v-if="view === 'table'" :models="filteredModels" :unit="unit" @open="openModel" /><div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"><PricingModelCardMain v-for="model in filteredModels" :key="model.name" :model="model" :unit="unit" @open="openModel" /></div></template>
        <article v-if="selectedModel" class="mx-auto w-full max-w-5xl text-[var(--landing-fg)]"><RouterLink v-if="modelId" to="/pricing" class="mb-8 -ml-2 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--landing-fg-soft)] hover:bg-[var(--landing-surface)] hover:text-[var(--landing-fg)]">← {{ t('modelMarketplace.backToModels') }}</RouterLink><p class="text-sm text-[var(--landing-fg-soft)]">{{ selectedPlatformName }}</p><h2 class="mt-1 break-all font-mono text-xl font-semibold">{{ selectedModel.name }}</h2><p class="mt-3 text-sm text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.providerCount', { count: selectedModel.providers.length }) }}</p><div class="mt-6 space-y-6"><PricingDetailNav v-model="activeSection" /><PricingModelDetails :model="selectedModel" :active-section="activeSection" /><PricingQuickStart v-if="activeSection === 'apps'" :api-origin="apiOrigin" :model-name="selectedModel.name" /></div></article>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import type { PublicMarketplaceModel, PublicPricingCatalogue } from '@/api/pricing'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PricingDetailNav from './PricingDetailNav.vue'
import PricingModelDetails from './PricingModelDetails.vue'
import PricingQuickStart from './PricingQuickStart.vue'
import PricingModelCardMain from './PricingModelCardMain.vue'
import PricingModelTableMain from './PricingModelTableMain.vue'
import PricingSidebarMain from './PricingSidebarMain.vue'
import PricingToolbarMain from './PricingToolbarMain.vue'
import { allModels, modelBillingMode, modelEndpoints, modelGroups, vendorOptions } from './pricingPresentation'

interface Props { marketplace?: PublicPricingCatalogue | null; loading?: boolean; errorMessage?: string; apiOrigin?: string; modelId?: string }
const props = withDefaults(defineProps<Props>(), { marketplace: null, loading: false, errorMessage: '', apiOrigin: '', modelId: '' })
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const search = ref('')
const sort = ref('name')
const recharge = ref(false)
const unit = ref<'M' | 'K'>('M')
const view = ref<'card' | 'table'>('table')
const vendorFilter = ref('')
const endpointFilter = ref('')
const quotaFilter = ref('')
const groupFilter = ref('')
const tagFilter = ref('')
const activeSection = ref<'providers' | 'pricing' | 'performance' | 'uptime' | 'benchmarks' | 'apps' | 'activity'>('providers')
const models = computed(() => allModels(props.marketplace))
const modelCount = computed(() => models.value.length)
const vendors = computed(() => vendorOptions(models.value))
const selectedModelName = computed(() => props.modelId || (typeof route.query.model === 'string' ? route.query.model : ''))
const selectedModel = computed<PublicMarketplaceModel | undefined>(() => models.value.find((model) => model.name === selectedModelName.value))
const selectedPlatformName = computed(() => props.marketplace?.platforms.find((platform) => platform.models.some((model) => model.name === selectedModelName.value))?.name ?? '')
const filteredModels = computed(() => {
  const query = search.value.trim().toLowerCase()
  return models.value.filter((model) => (!vendorFilter.value || model.providers.some((provider) => provider.name === vendorFilter.value)) && (!endpointFilter.value || modelEndpoints(model).includes(endpointFilter.value)) && (!quotaFilter.value || modelBillingMode(model) === quotaFilter.value) && (!groupFilter.value || modelGroups(model).includes(groupFilter.value)) && (!tagFilter.value || modelGroups(model).includes(tagFilter.value)) && (!query || `${model.name} ${model.providers.map((provider) => provider.name).join(' ')}`.toLowerCase().includes(query))).sort((a, b) => sort.value === 'price' ? a.name.localeCompare(b.name) : a.name.localeCompare(b.name))
})
function resetFilters() { vendorFilter.value = ''; endpointFilter.value = ''; quotaFilter.value = ''; groupFilter.value = ''; tagFilter.value = '' }
async function openModel(modelName: string) { await router.push({ name: 'PricingModel', params: { modelId: modelName } }) }
</script>
