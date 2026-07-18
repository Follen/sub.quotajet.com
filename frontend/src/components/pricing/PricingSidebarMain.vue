<template>
  <aside
    data-testid="pricing-sidebar"
    class="pricing-panel rounded-[10px] border border-pricing p-3"
    :class="mobile ? '' : 'pricing-scroll sticky top-4 hidden max-h-[calc(100dvh-2rem)] self-start overflow-y-auto xl:block'"
  >
    <div class="mb-2 flex items-center justify-between gap-3">
      <p class="text-xs leading-relaxed text-pricing-muted">
        {{ t('Refine models by provider, group, type, and tags.') }}
      </p>
      <button
        type="button"
        class="pricing-ghost-button shrink-0"
        :disabled="!hasFilters"
        @click="emit('reset')"
      >
        <Icon name="refresh" size="xs" />
        {{ t('Reset') }}
      </button>
    </div>

    <div class="space-y-1">
      <section
        v-for="section in sections"
        :key="section.key"
        class="border-b border-pricing pb-3 last:border-b-0"
      >
        <button
          type="button"
          class="group flex w-full items-center justify-between py-2.5 text-left text-sm font-medium"
          :aria-expanded="openSections.has(section.key)"
          @click="toggle(section.key)"
        >
          <span>{{ section.title }}</span>
          <Icon
            name="chevronDown"
            size="sm"
            class="text-pricing-muted transition-transform"
            :class="openSections.has(section.key) ? 'rotate-180' : ''"
          />
        </button>

        <div v-if="openSections.has(section.key)" class="flex flex-wrap gap-1.5">
          <button
            v-for="option in section.options"
            :key="option.value"
            type="button"
            class="pricing-filter-chip"
            :class="isActive(section.key, option.value) ? 'is-active' : ''"
            :data-testid="section.key === 'group' && option.value ? `pricing-filter-group-${option.value}` : undefined"
            @click="select(section.key, option.value)"
          >
            <span v-if="option.initial" class="pricing-vendor-mark">{{ option.initial }}</span>
            <span class="max-w-44 truncate">{{ option.label }}</span>
            <span v-if="option.suffix" class="pricing-filter-count">{{ option.suffix }}</span>
            <span v-else-if="option.count != null" class="pricing-filter-count">{{ option.count }}</span>
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import type { PricingCatalogueModel, PricingVendorOption } from './pricingPresentation'
import {
  formatPlatformName,
  groupPriceEntries,
  modelBillingMode,
  modelEndpoints,
  modelGroups,
  modelTags,
} from './pricingPresentation'

type FilterKey = 'vendor' | 'endpoint' | 'quota' | 'group' | 'tag'

interface FilterOption {
  value: string
  label: string
  count?: number
  suffix?: string
  initial?: string
}

interface FilterSection {
  key: FilterKey
  title: string
  options: FilterOption[]
}

const props = withDefaults(
  defineProps<{
    models: PricingCatalogueModel[]
    vendors: PricingVendorOption[]
    vendor: string
    endpoint: string
    quota: string
    group: string
    tag: string
    mobile?: boolean
  }>(),
  { mobile: false },
)

const emit = defineEmits<{
  'update:vendor': [value: string]
  'update:endpoint': [value: string]
  'update:quota': [value: string]
  'update:group': [value: string]
  'update:tag': [value: string]
  reset: []
}>()

const { t } = useI18n()
const openSections = ref(new Set<FilterKey>(['vendor', 'endpoint', 'quota', 'group', 'tag']))

const hasFilters = computed(() =>
  Boolean(props.vendor || props.endpoint || props.quota || props.group || props.tag),
)

const endpointDefinitions = [
  { value: '/v1/chat/completions', label: 'Chat' },
  { value: '/v1/responses', label: 'Response' },
  { value: '/v1/messages', label: 'Anthropic' },
  { value: '/v1beta/models', label: 'Gemini' },
  { value: '/v1/rerank', label: 'Rerank' },
  { value: '/v1/images/generations', label: t('Image') },
  { value: '/v1/embeddings', label: t('Embeddings') },
  { value: '/v1/videos/generations', label: t('Video') },
]

const groups = computed(() =>
  [...new Set(props.models.flatMap(modelGroups))].sort((left, right) => left.localeCompare(right)),
)

const tags = computed(() =>
  [...new Set(props.models.flatMap(modelTags))].sort((left, right) => left.localeCompare(right)),
)

const sections = computed<FilterSection[]>(() => [
  {
    key: 'vendor',
    title: t('All Vendors'),
    options: [
      { value: '', label: t('All Vendors'), count: props.models.length },
      ...props.vendors.map((vendor) => ({
        value: vendor.name,
        label: formatPlatformName(vendor.name),
        count: vendor.count,
        initial: formatPlatformName(vendor.name).charAt(0),
      })),
    ],
  },
  {
    key: 'endpoint',
    title: t('Endpoint Type'),
    options: [
      { value: '', label: t('All Types'), count: props.models.length },
      ...endpointDefinitions.map((endpoint) => ({
        ...endpoint,
        count: props.models.filter((model) => modelEndpoints(model).includes(endpoint.value)).length,
      })),
    ],
  },
  {
    key: 'quota',
    title: t('Pricing Type'),
    options: [
      { value: '', label: t('All Models'), count: props.models.length },
      {
        value: 'token',
        label: t('Token-based'),
        count: props.models.filter((model) => modelBillingMode(model) === 'token').length,
      },
      {
        value: 'request',
        label: t('Per Request'),
        count: props.models.filter((model) => modelBillingMode(model) !== 'token').length,
      },
    ],
  },
  {
    key: 'group',
    title: t('Groups'),
    options: [
      { value: '', label: t('All Groups') },
      ...groups.value.map((group) => {
        const ratios = props.models
          .flatMap(groupPriceEntries)
          .filter((entry) => entry.group.name === group)
          .map((entry) => entry.group.rate_multiplier)
          .filter(Number.isFinite)
        return {
          value: group,
          label: group,
          suffix: ratios.length > 0 ? `x${Math.min(...ratios)}` : undefined,
        }
      }),
    ],
  },
  {
    key: 'tag',
    title: t('Model Tags'),
    options: [
      { value: '', label: t('All Tags'), count: props.models.length },
      ...tags.value.map((tag) => ({
        value: tag,
        label: tag,
        count: props.models.filter((model) => modelTags(model).includes(tag)).length,
      })),
    ],
  },
])

function toggle(key: FilterKey) {
  const next = new Set(openSections.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  openSections.value = next
}

function isActive(key: FilterKey, value: string): boolean {
  return props[key] === value
}

function select(key: FilterKey, value: string) {
  if (key === 'vendor') emit('update:vendor', value)
  else if (key === 'endpoint') emit('update:endpoint', value)
  else if (key === 'quota') emit('update:quota', value)
  else if (key === 'group') emit('update:group', value)
  else emit('update:tag', value)
}
</script>
