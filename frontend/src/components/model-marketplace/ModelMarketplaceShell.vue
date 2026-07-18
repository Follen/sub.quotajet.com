<template>
  <section class="mx-auto w-full max-w-7xl space-y-6" aria-labelledby="model-marketplace-title">
    <header class="space-y-2">
      <p class="text-sm font-medium text-primary-600 dark:text-primary-400">
        {{ t('modelMarketplace.eyebrow') }}
      </p>
      <h1 id="model-marketplace-title" class="text-3xl font-semibold text-gray-900 dark:text-white">
        {{ t('modelMarketplace.title') }}
      </h1>
      <p class="max-w-2xl text-sm text-gray-600 dark:text-content-muted">
        {{ t('modelMarketplace.description') }}
      </p>
    </header>

    <div v-if="loading" data-testid="marketplace-loading" class="flex min-h-64 items-center justify-center gap-3">
      <LoadingSpinner />
      <span class="text-sm text-gray-600 dark:text-content-muted">{{ t('modelMarketplace.loading') }}</span>
    </div>

    <div v-else-if="errorMessage" data-testid="marketplace-error" class="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/20">
      <h2 class="font-medium text-red-800 dark:text-red-200">{{ t('modelMarketplace.error.title') }}</h2>
      <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
      <button type="button" class="btn btn-secondary mt-4" @click="emit('retry')">
        {{ t('modelMarketplace.error.retry') }}
      </button>
    </div>

    <div v-else-if="platforms.length === 0" data-testid="marketplace-empty" class="rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-dark-600">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">{{ t('modelMarketplace.empty.title') }}</h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-content-muted">{{ t('modelMarketplace.empty.description') }}</p>
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
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200'"
            @click="selectPlatform(platform.name)"
          >
            {{ platform.name }}
          </button>
        </div>
      </nav>

      <div class="grid gap-6 lg:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)]">
        <aside class="rounded-xl border border-gray-200 bg-white p-3 dark:border-dark-600 dark:bg-dark-800">
          <p class="px-2 pb-2 text-xs font-medium text-gray-500 dark:text-content-muted">
            {{ t('modelMarketplace.models') }}
          </p>
          <div class="max-h-[28rem] space-y-1 overflow-y-auto">
            <button
              v-for="model in activePlatform?.models ?? []"
              :key="model.name"
              :data-testid="`marketplace-model-${model.name}`"
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
              :class="selectedModel?.name === model.name
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-700'"
              @click="selectModel(model.name)"
            >
              <span class="truncate font-mono">{{ model.name }}</span>
              <span class="ml-3 shrink-0 text-xs text-gray-500 dark:text-content-muted">
                {{ model.providers.length }}
              </span>
            </button>
          </div>
        </aside>

        <article v-if="selectedModel" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-800">
          <p class="text-sm text-gray-500 dark:text-content-muted">{{ activePlatform?.name }}</p>
          <h2 class="mt-1 break-all font-mono text-xl font-semibold text-gray-900 dark:text-white">
            {{ selectedModel.name }}
          </h2>
          <p class="mt-4 text-sm text-gray-600 dark:text-content-muted">
            {{ t('modelMarketplace.providerCount', { count: selectedModel.providers.length }) }}
          </p>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import type {
  PublicMarketplaceModel,
  PublicMarketplacePlatform,
  PublicModelMarketplace,
} from '@/api/modelMarketplace'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

interface Props {
  marketplace?: PublicModelMarketplace | null
  loading?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  marketplace: null,
  loading: false,
  errorMessage: '',
})

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const activePlatformName = ref('')

const platforms = computed<PublicMarketplacePlatform[]>(() => props.marketplace?.platforms ?? [])
const selectedModelName = computed(() => {
  const value = route.query.model
  return typeof value === 'string' ? value : ''
})
const selectedModelPlatform = computed(() =>
  platforms.value.find((platform) =>
    platform.models.some((model) => model.name === selectedModelName.value),
  ),
)
const activePlatform = computed(() => {
  if (selectedModelPlatform.value) return selectedModelPlatform.value
  return platforms.value.find((platform) => platform.name === activePlatformName.value) ?? platforms.value[0]
})
const selectedModel = computed<PublicMarketplaceModel | undefined>(() =>
  activePlatform.value?.models.find((model) => model.name === selectedModelName.value) ?? activePlatform.value?.models[0],
)

async function selectPlatform(platformName: string): Promise<void> {
  activePlatformName.value = platformName
  const platform = platforms.value.find((item) => item.name === platformName)
  const firstModel = platform?.models[0]
  if (firstModel) {
    await selectModel(firstModel.name)
  }
}

async function selectModel(modelName: string): Promise<void> {
  await router.replace({
    query: {
      ...route.query,
      model: modelName,
    },
  })
}
</script>
