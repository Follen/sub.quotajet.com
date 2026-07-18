<template>
  <section class="mx-auto w-full max-w-7xl space-y-6 rounded-xl bg-slate-950 p-4 sm:p-6" aria-labelledby="model-marketplace-title">
    <header class="space-y-2">
      <p class="text-sm font-medium text-lime-300">
        {{ t('modelMarketplace.eyebrow') }}
      </p>
      <h1 id="model-marketplace-title" class="text-3xl font-semibold text-white">
        {{ t('modelMarketplace.title') }}
      </h1>
      <p class="max-w-2xl text-sm text-slate-400">
        {{ t('modelMarketplace.description') }}
      </p>
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
      <nav class="overflow-x-auto pb-1" :aria-label="t('modelMarketplace.platforms')">
        <div class="flex min-w-max gap-2" role="tablist">
          <button
            v-for="platform in platforms"
            :key="platform.name"
            :data-testid="`marketplace-platform-${platform.name}`"
            type="button"
            role="tab"
            :aria-selected="activePlatform?.name === platform.name"
            class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            :class="activePlatform?.name === platform.name
              ? 'border-lime-400/60 bg-lime-400/10 text-lime-300'
              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white'"
            @click="selectPlatform(platform.name)"
          >
            {{ platform.name }}
          </button>
        </div>
      </nav>

      <div class="grid gap-6 lg:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)]">
        <aside class="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <div class="flex items-center justify-between gap-2 px-2 pb-2">
            <label for="marketplace-model-search" class="text-xs font-medium text-slate-500">
              {{ t('modelMarketplace.models') }}
            </label>
            <button
              v-if="modelSearch"
              type="button"
              data-testid="marketplace-model-search-clear"
              class="text-[11px] text-slate-500 hover:text-slate-200"
              @click="modelSearch = ''"
            >
              {{ t('modelMarketplace.search.clear') }}
            </button>
          </div>
          <input
            id="marketplace-model-search"
            v-model="modelSearch"
            data-testid="marketplace-model-search"
            type="search"
            :placeholder="t('modelMarketplace.search.placeholder')"
            class="mb-3 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-lime-400/60"
          />
          <div class="max-h-[28rem] space-y-1 overflow-y-auto">
            <button
              v-for="model in visibleModels"
              :key="model.name"
              :data-testid="`marketplace-model-${model.name}`"
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
              :class="selectedModel?.name === model.name
                ? 'bg-lime-400/10 text-lime-300'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'"
              @click="selectModel(model.name, activePlatform?.name)"
            >
              <span class="truncate font-mono">{{ model.name }}</span>
              <span class="ml-3 shrink-0 text-xs text-slate-500">
                {{ model.providers.length }}
              </span>
            </button>
            <p v-if="visibleModels.length === 0" data-testid="marketplace-model-search-empty" class="px-3 py-4 text-sm text-slate-500">
              {{ t('modelMarketplace.search.empty') }}
            </p>
          </div>
        </aside>

        <article v-if="selectedModel" class="rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-slate-100 lg:p-6">
          <p class="text-sm text-slate-500">{{ activePlatform?.name }}</p>
          <h2 class="mt-1 break-all font-mono text-xl font-semibold text-white">
            {{ selectedModel.name }}
          </h2>
          <p class="mt-3 text-sm text-slate-400">
            {{ t('modelMarketplace.providerCount', { count: selectedModel.providers.length }) }}
          </p>
          <div class="mt-6 grid gap-6 xl:grid-cols-[10.5rem_minmax(0,1fr)_minmax(18rem,22rem)]">
            <MarketplaceDetailNav v-model="activeSection" />
            <MarketplaceModelDetails :model="selectedModel" :active-section="activeSection" />
            <MarketplaceQuickStart :api-origin="apiOrigin" :model-name="selectedModel.name" />
          </div>
        </article>
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
  PublicModelMarketplace,
} from '@/api/modelMarketplace'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import MarketplaceDetailNav from './MarketplaceDetailNav.vue'
import MarketplaceModelDetails from './MarketplaceModelDetails.vue'
import MarketplaceQuickStart from './MarketplaceQuickStart.vue'

interface Props {
  marketplace?: PublicModelMarketplace | null
  loading?: boolean
  errorMessage?: string
  apiOrigin?: string
}

const props = withDefaults(defineProps<Props>(), {
  marketplace: null,
  loading: false,
  errorMessage: '',
  apiOrigin: '',
})

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const activePlatformName = ref('')
const activeSection = ref<'providers' | 'pricing' | 'performance' | 'uptime' | 'benchmarks' | 'apps' | 'activity'>('providers')
const modelSearch = ref('')

const platforms = computed<PublicMarketplacePlatform[]>(() => props.marketplace?.platforms ?? [])
const selectedModelName = computed(() => {
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
  return platforms.value.find((platform) => platform.name === activePlatformName.value) ?? platforms.value[0]
})
const visibleModels = computed<PublicMarketplaceModel[]>(() => {
  const models = activePlatform.value?.models ?? []
  const query = modelSearch.value.trim().toLowerCase()
  if (!query) return models
  return models.filter((model) => model.name.toLowerCase().includes(query))
})
const selectedModel = computed<PublicMarketplaceModel | undefined>(() =>
  visibleModels.value.find((model) => model.name === selectedModelName.value) ?? visibleModels.value[0],
)

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

async function selectPlatform(platformName: string): Promise<void> {
  activePlatformName.value = platformName
  modelSearch.value = ''
  const platform = platforms.value.find((item) => item.name === platformName)
  const firstModel = platform?.models[0]
  if (firstModel) {
    await selectModel(firstModel.name, platformName)
  }
}

async function selectModel(modelName: string, targetPlatformName?: string): Promise<void> {
  const platformName = targetPlatformName ?? activePlatform.value?.name
  await router.replace({
    query: {
      ...route.query,
      ...(platformName ? { platform: platformName } : {}),
      model: modelName,
    },
  })
}
</script>
