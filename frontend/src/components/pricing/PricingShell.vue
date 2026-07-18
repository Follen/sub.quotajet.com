<template>
  <section class="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8" aria-labelledby="model-marketplace-title">
    <header v-if="!modelId" class="mb-8 space-y-6">
      <div class="space-y-2">
      <h1 id="model-marketplace-title" class="text-lg font-semibold tracking-tight text-[var(--landing-fg)]">
        {{ t('Models & pricing') }}
      </h1>
      <p class="max-w-3xl text-sm leading-relaxed text-[var(--landing-fg-soft)]">
        {{ t('Discover curated AI models, compare pricing and capabilities, and choose the right model for every scenario.') }}
        {{ t('modelMarketplace.modelsEnabled', { count: modelCount }) }}
      </p>
      </div>
    </header>

    <div v-if="loading" data-testid="marketplace-loading" class="flex min-h-64 items-center justify-center gap-3">
      <LoadingSpinner />
      <span class="text-sm text-slate-400">{{ t('modelMarketplace.loading') }}</span>
    </div>

    <div v-else-if="errorMessage" data-testid="marketplace-error" class="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/20">
      <h2 class="font-medium text-red-800 dark:text-red-200">{{ t('modelMarketplace.error.title') }}</h2>
      <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
      <button type="button" class="btn btn-secondary mt-4" @click="emit('retry')">
        {{ t('modelMarketplace.error.retry') }}
      </button>
    </div>

    <div v-else-if="platforms.length === 0" data-testid="marketplace-empty" class="rounded-xl border border-dashed border-slate-700 p-10 text-center">
      <h2 class="text-lg font-medium text-white">{{ t('modelMarketplace.empty.title') }}</h2>
      <p class="mt-2 text-sm text-slate-400">{{ t('modelMarketplace.empty.description') }}</p>
    </div>

    <template v-else>
      <div class="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside v-if="!modelId" class="h-fit rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] p-4 xl:sticky xl:top-4">
          <p class="mb-2 text-sm font-medium text-[var(--landing-fg)]">{{ t('All Vendors') }}</p>
          <div class="flex flex-wrap gap-2" role="tablist">
          <button type="button" class="inline-flex min-h-7 items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors" :class="!vendorFilter ? 'border-[var(--landing-fg)]/30 bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'border-[var(--landing-border)] text-[var(--landing-fg-soft)]'" @click="vendorFilter = ''">{{ t('All Vendors') }} <span class="rounded bg-[var(--landing-surface-strong)] px-1.5 py-0.5 tabular-nums">{{ modelCount }}</span></button>
          <button
            v-for="vendor in vendors"
            :key="vendor.name"
            :data-testid="`marketplace-vendor-${vendor.name}`"
            type="button"
            role="button"
            class="inline-flex min-h-7 items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="vendorFilter === vendor.name
              ? 'border-[var(--landing-fg)]/30 bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]'
              : 'border-[var(--landing-border)] text-[var(--landing-fg-soft)] hover:bg-[var(--landing-surface-strong)] hover:text-[var(--landing-fg)]'"
            @click="vendorFilter = vendor.name"
          >
            {{ vendor.name }}
            <span class="rounded bg-[var(--landing-surface-strong)] px-1.5 py-0.5 tabular-nums">{{ vendor.count }}</span>
          </button>
          </div>
          <div class="mt-4 space-y-1">
            <div class="border-b border-[var(--landing-border)] py-2.5"><p class="mb-2 text-sm font-medium text-[var(--landing-fg)]">{{ t('Endpoint Type') }}</p><div class="flex flex-wrap gap-1.5"><span v-for="endpoint in endpointTypes" :key="endpoint" class="rounded-md border border-[var(--landing-border)] px-2 py-1 text-xs text-[var(--landing-fg-soft)]">{{ endpoint }}</span></div></div>
            <div class="border-b border-[var(--landing-border)] py-2.5"><p class="mb-2 text-sm font-medium text-[var(--landing-fg)]">{{ t('Pricing Type') }}</p><div class="flex flex-wrap gap-1.5"><span class="rounded-md border border-[var(--landing-border)] px-2 py-1 text-xs text-[var(--landing-fg-soft)]">{{ t('All Models') }} {{ modelCount }}</span><span class="rounded-md border border-[var(--landing-border)] px-2 py-1 text-xs text-[var(--landing-fg-soft)]">{{ t('Token-based') }}</span><span class="rounded-md border border-[var(--landing-border)] px-2 py-1 text-xs text-[var(--landing-fg-soft)]">{{ t('Per Request') }}</span></div></div>
            <div class="border-b border-[var(--landing-border)] py-2.5"><p class="mb-2 text-sm font-medium text-[var(--landing-fg)]">{{ t('Groups') }}</p><div class="flex flex-wrap gap-1.5"><span v-for="group in allGroups" :key="group" class="rounded-md border border-[var(--landing-border)] px-2 py-1 text-xs text-[var(--landing-fg-soft)]">{{ group }}</span></div></div>
            <div class="py-2.5"><p class="mb-2 text-sm font-medium text-[var(--landing-fg)]">{{ t('Model Tags') }}</p><span class="rounded-md border border-[var(--landing-border)] px-2 py-1 text-xs text-[var(--landing-fg-soft)]">{{ t('All Tags') }}</span></div>
          </div>
        </aside>

        <main class="min-w-0 space-y-4" :class="modelId ? 'xl:col-span-2' : ''">
          <div v-if="!modelId" class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input v-model="modelSearch" type="search" :placeholder="t('Search model name, provider, endpoint, or tag...')" class="w-full rounded-md border border-[var(--landing-border)] bg-transparent px-3 py-2 text-sm text-[var(--landing-fg)] outline-none placeholder:text-[var(--landing-fg-muted)] focus:border-[var(--landing-fg)]/40 sm:max-w-sm" />
            <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
              <button type="button" class="rounded-md border border-[var(--landing-border)] px-2.5 py-2 text-xs text-[var(--landing-fg-soft)]">{{ t('Filter') }}</button><select v-model="sortMode" class="rounded-md border border-[var(--landing-border)] bg-transparent px-2.5 py-2 text-xs text-[var(--landing-fg-soft)]"><option value="name">↕ {{ t('Name') }}</option><option value="price">↕ {{ t('Price') }}</option></select><div class="flex rounded-md border border-[var(--landing-border)] p-0.5"><button type="button" class="rounded px-2 py-1.5 text-xs" :class="!showRecharge ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="showRecharge = false">{{ t('Standard') }}</button><button type="button" class="rounded px-2 py-1.5 text-xs" :class="showRecharge ? 'bg-[var(--landing-surface-strong)] text-[var(--landing-fg)]' : 'text-[var(--landing-fg-soft)]'" @click="showRecharge = true">{{ t('Recharge') }}</button></div>
              <button type="button" class="rounded-md border border-[var(--landing-border)] px-2.5 py-2 text-xs text-[var(--landing-fg-soft)]" @click="tokenUnit = tokenUnit === 'M' ? 'K' : 'M'">1{{ tokenUnit }}</button>
              <button type="button" class="rounded-md border border-[var(--landing-border)] px-2.5 py-2 text-xs text-[var(--landing-fg-soft)]" @click="viewMode = viewMode === 'card' ? 'table' : 'card'">{{ viewMode === 'card' ? t('Table view') : t('Card view') }}</button>
            </div>
          </div>
          <p v-if="!modelId" class="text-sm text-[var(--landing-fg-soft)]"><span class="font-medium text-[var(--landing-fg)]">{{ visibleModels.length }}</span> {{ visibleModels.length === 1 ? t('model') : t('models') }}</p>
          <div v-if="!modelId && viewMode === 'card'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <button v-for="model in visibleModels" :key="model.name" type="button" class="group rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:bg-[var(--landing-surface-strong)]" @click="selectModel(model.name, activePlatform?.name)">
              <div class="flex items-start gap-3"><div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-surface-strong)] font-mono text-sm">{{ model.name.charAt(0).toUpperCase() }}</div><div class="min-w-0"><h2 class="truncate font-mono text-sm font-medium text-[var(--landing-fg)]">{{ model.name }}</h2><p class="mt-0.5 text-xs text-[var(--landing-fg-soft)]">{{ model.providers.length }} {{ t('modelMarketplace.providers') }}</p></div></div>
              <div class="mt-4 border-y border-[var(--landing-border)] py-3"><div class="grid grid-cols-2 gap-3"><div><p class="text-xs text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.prices.input') }}</p><p class="mt-1 text-sm font-semibold text-[var(--landing-fg)]">{{ modelInputPrice(model) }}</p></div><div><p class="text-xs text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.prices.output') }}</p><p class="mt-1 text-sm font-semibold text-[var(--landing-fg)]">{{ modelOutputPrice(model) }}</p></div></div></div>
              <div class="mt-3 flex flex-wrap gap-1.5"><span v-for="group in modelGroups(model).slice(0, 3)" :key="group" class="rounded-md bg-[var(--landing-surface-strong)] px-2 py-1 text-[11px] text-[var(--landing-fg-soft)]">{{ group }}</span></div>
            </button>
          </div>
          <div v-else-if="!modelId" class="overflow-x-auto rounded-lg border border-[var(--landing-border)]"><table class="w-full text-left text-sm"><thead class="border-b border-[var(--landing-border)] text-xs text-[var(--landing-fg-soft)]"><tr><th class="px-4 py-3 font-medium">{{ t('Model') }}</th><th class="px-4 py-3 font-medium">{{ t('Provider') }}</th><th class="px-4 py-3 font-medium">{{ t('Pricing Type') }}</th><th class="px-4 py-3 text-right font-medium">{{ t('Input') }}</th><th class="px-4 py-3 text-right font-medium">{{ t('Output') }}</th><th class="px-4 py-3 font-medium">{{ t('Groups') }}</th></tr></thead><tbody><tr v-for="model in visibleModels" :key="model.name" class="cursor-pointer border-b border-[var(--landing-border)] last:border-0 hover:bg-[var(--landing-surface-strong)]" @click="selectModel(model.name, activePlatform?.name)"><td class="px-4 py-3 font-mono text-xs">{{ model.name }}</td><td class="px-4 py-3 text-xs text-[var(--landing-fg-soft)]">{{ model.providers.map((provider) => provider.name).join(', ') }}</td><td class="px-4 py-3 text-xs text-[var(--landing-fg-soft)]">{{ model.providers[0]?.group_prices[0]?.price?.billing_mode === 'per_request' ? t('Per Request') : t('Token-based') }}</td><td class="px-4 py-3 text-right font-mono text-xs">{{ modelInputPrice(model) }}</td><td class="px-4 py-3 text-right font-mono text-xs">{{ modelOutputPrice(model) }}</td><td class="px-4 py-3 text-xs text-[var(--landing-fg-soft)]">{{ modelGroups(model).join(', ') }}</td></tr></tbody></table></div>
        <article v-if="selectedModel" class="mx-auto w-full max-w-5xl text-[var(--landing-fg)]">
          <RouterLink v-if="modelId" to="/pricing" class="mb-8 -ml-2 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--landing-fg-soft)] hover:bg-[var(--landing-surface)] hover:text-[var(--landing-fg)]">← {{ t('modelMarketplace.backToModels') }}</RouterLink>
          <p class="text-sm text-[var(--landing-fg-soft)]">{{ activePlatform?.name }}</p>
          <h2 class="mt-1 break-all font-mono text-xl font-semibold text-[var(--landing-fg)]">
            {{ selectedModel.name }}
          </h2>
          <p class="mt-3 text-sm text-[var(--landing-fg-soft)]">
            {{ t('modelMarketplace.providerCount', { count: selectedModel.providers.length }) }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span v-if="selectedModel.capabilities?.pricing" class="rounded-full border border-[var(--landing-accent)]/40 bg-[var(--landing-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--landing-accent)]">{{ t('modelMarketplace.capabilities.pricing') }}</span>
            <span v-if="selectedModel.capabilities?.image_generation" class="rounded-full border border-[var(--landing-border)] px-2.5 py-1 text-xs text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.capabilities.imageGeneration') }}</span>
            <span v-if="selectedModel.capabilities?.video_generation" class="rounded-full border border-[var(--landing-border)] px-2.5 py-1 text-xs text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.capabilities.videoGeneration') }}</span>
          </div>
          <div class="mt-6 space-y-6">
            <PricingDetailNav v-model="activeSection" />
            <PricingModelDetails :model="selectedModel" :active-section="activeSection" />
            <PricingQuickStart v-if="activeSection === 'apps'" :api-origin="apiOrigin" :model-name="selectedModel.name" />
          </div>
        </article>
        </main>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import type {
  PublicMarketplaceModel,
  PublicMarketplacePlatform,
  PublicPricingCatalogue,
} from '@/api/pricing'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PricingDetailNav from './PricingDetailNav.vue'
import PricingModelDetails from './PricingModelDetails.vue'
import PricingQuickStart from './PricingQuickStart.vue'

interface Props {
  marketplace?: PublicPricingCatalogue | null
  loading?: boolean
  errorMessage?: string
  apiOrigin?: string
  modelId?: string
}

const props = withDefaults(defineProps<Props>(), {
  marketplace: null,
  loading: false,
  errorMessage: '',
  apiOrigin: '',
  modelId: '',
})

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const activeSection = ref<'providers' | 'pricing' | 'performance' | 'uptime' | 'benchmarks' | 'apps' | 'activity'>('providers')
const modelSearch = ref('')
const vendorFilter = ref('')
const sortMode = ref<'name' | 'price'>('name')
const tokenUnit = ref<'M' | 'K'>('M')
const viewMode = ref<'card' | 'table'>('table')
const showRecharge = ref(false)

const platforms = computed<PublicMarketplacePlatform[]>(() => props.marketplace?.platforms ?? [])
const modelCount = computed(() => platforms.value.reduce((count, platform) => count + platform.models.length, 0))
const vendors = computed(() => {
  const counts = new Map<string, number>()
  for (const model of platforms.value.flatMap((platform) => platform.models)) {
    for (const provider of model.providers) counts.set(provider.name, (counts.get(provider.name) ?? 0) + 1)
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }))
})
const endpointTypes = computed(() => [...new Set(platforms.value.flatMap((platform) => platform.models.flatMap((model) => model.platform_default_inbound_endpoints ?? [])))])
const allGroups = computed(() => [...new Set(platforms.value.flatMap((platform) => platform.models.flatMap(modelGroups)))].sort())
const selectedModelName = computed(() => {
  if (props.modelId) return props.modelId
  const value = route.query.model
  return typeof value === 'string' ? value : ''
})
const selectedPlatformName = computed(() => {
  const value = route.query.platform
  return typeof value === 'string' ? value : ''
})
const selectedPlatformFromQuery = computed(() =>
  platforms.value.find((platform) => platform.name === selectedPlatformName.value),
)
const selectedModelPlatform = computed(() =>
  selectedPlatformFromQuery.value?.models.some((model) => model.name === selectedModelName.value)
    ? selectedPlatformFromQuery.value
    : platforms.value.find((platform) =>
    platform.models.some((model) => model.name === selectedModelName.value),
  ),
)
const activePlatform = computed(() => {
  if (selectedModelPlatform.value) return selectedModelPlatform.value
  if (selectedPlatformFromQuery.value) return selectedPlatformFromQuery.value
  return platforms.value.find((platform) => platform.name === selectedPlatformName.value)
})
const visibleModels = computed<PublicMarketplaceModel[]>(() => {
  const models = activePlatform.value?.models ?? platforms.value.flatMap((platform) => platform.models)
  const query = modelSearch.value.trim().toLowerCase()
  const vendorFiltered = vendorFilter.value ? models.filter((model) => model.providers.some((provider) => provider.name === vendorFilter.value)) : models
  const filtered = query ? vendorFiltered.filter((model) => model.name.toLowerCase().includes(query)) : vendorFiltered
  return [...filtered].sort((a, b) => sortMode.value === 'name' ? a.name.localeCompare(b.name) : (firstPrice(a, 'input_price') ?? Infinity) - (firstPrice(b, 'input_price') ?? Infinity))
})
const selectedModel = computed<PublicMarketplaceModel | undefined>(() =>
  selectedModelName.value ? platforms.value.flatMap((platform) => platform.models).find((model) => model.name === selectedModelName.value) : undefined,
)

function firstPrice(model: PublicMarketplaceModel, key: 'input_price' | 'output_price'): number | null {
  for (const provider of model.providers) {
    for (const group of provider.group_prices) {
      const value = group.price?.[key]
      if (typeof value === 'number' && Number.isFinite(value)) return value * group.rate_multiplier
    }
  }
  return null
}

function formatCardPrice(value: number | null): string {
  if (value === null) return '—'
  if (value === 0) return '0'
  const scaled = value * (tokenUnit.value === 'M' ? 1_000_000 : 1_000)
  if (scaled < 0.01) return scaled.toFixed(4)
  return scaled.toFixed(2)
}

function modelInputPrice(model: PublicMarketplaceModel): string {
  return formatCardPrice(firstPrice(model, 'input_price'))
}

function modelOutputPrice(model: PublicMarketplaceModel): string {
  return formatCardPrice(firstPrice(model, 'output_price'))
}

function modelGroups(model: PublicMarketplaceModel): string[] {
  return [...new Set(model.providers.flatMap((provider) => provider.group_prices.map((group) => group.name)))]
}

watch(
  () => [activePlatform.value?.name, selectedModel.value?.name],
  ([platformName, modelName]) => {
    if (!platformName || !modelName) return
    if (platformName === selectedPlatformName.value && modelName === selectedModelName.value) return
    void router.replace({
      query: {
        ...route.query,
        platform: platformName,
        model: modelName,
      },
    })
  },
  { immediate: true },
)

async function selectModel(modelName: string, targetPlatformName?: string): Promise<void> {
  const platformName = targetPlatformName ?? activePlatform.value?.name
  if (!props.modelId) {
    await router.push({
      name: 'PricingModel',
      params: { modelId: modelName },
      query: platformName ? { platform: platformName } : {},
    })
    return
  }
  await router.replace({
    query: {
      ...route.query,
      ...(platformName ? { platform: platformName } : {}),
      model: modelName,
    },
  })
}
</script>
