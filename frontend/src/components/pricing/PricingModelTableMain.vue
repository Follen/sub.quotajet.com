<template>
  <div data-testid="pricing-table" class="space-y-4">
    <div class="pricing-table-wrap overflow-x-auto rounded-[10px] border border-pricing">
      <table class="w-full min-w-[1240px] table-fixed text-left text-sm">
        <colgroup>
          <col class="w-[260px]" />
          <col class="w-[130px]" />
          <col class="w-[130px]" />
          <col class="w-[130px]" />
          <col class="w-[160px]" />
          <col class="w-[160px]" />
          <col class="w-[150px]" />
          <col class="w-[140px]" />
        </colgroup>
        <thead>
          <tr class="border-b border-pricing">
            <th class="pricing-th">{{ t('Model') }}</th>
            <th class="pricing-th text-right">{{ t('Input') }}</th>
            <th class="pricing-th text-right">{{ t('Cached input') }}</th>
            <th class="pricing-th text-right">{{ t('Output') }}</th>
            <th class="pricing-th">{{ t('Health') }}</th>
            <th class="pricing-th">{{ t('Tags') }}</th>
            <th class="pricing-th">{{ t('Endpoints') }}</th>
            <th class="pricing-th">{{ t('Groups') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="model in pagedModels"
            :key="`${model.platform}:${model.name}`"
            :data-testid="`pricing-row-${model.name}`"
            tabindex="0"
            class="pricing-row cursor-pointer border-b border-pricing last:border-b-0"
            @click="emit('open', model)"
            @keydown.enter="emit('open', model)"
            @keydown.space.prevent="emit('open', model)"
          >
            <td class="p-2">
              <div class="flex min-w-0 items-start gap-3 py-1">
                <div class="pricing-model-mark">{{ model.name.charAt(0).toUpperCase() || '?' }}</div>
                <div class="min-w-0">
                  <p class="truncate font-mono text-sm font-medium">{{ model.name }}</p>
                  <p class="mt-0.5 truncate text-xs text-pricing-muted">{{ formatPlatformName(model.platform) }}</p>
                </div>
              </div>
            </td>
            <td class="pricing-price-cell" data-price="input">
              <template v-if="modelBillingMode(model) === 'token'">
                <p>{{ formatModelPrice(model, 'input_price', unit, selectedGroup) }}</p>
                <span>/ {{ unit === 'M' ? '1M' : '1K' }} {{ t('tokens') }}</span>
              </template>
              <template v-else>
                <p>{{ formatModelFixedPrice(model, selectedGroup) }}</p>
                <span>/ {{ t('request') }}</span>
              </template>
            </td>
            <td class="pricing-price-cell" data-price="cache">
              <template v-if="modelBillingMode(model) === 'token'">
                <p>{{ formatModelPrice(model, 'cache_read_price', unit, selectedGroup) }}</p>
                <span>/ {{ unit === 'M' ? '1M' : '1K' }} {{ t('tokens') }}</span>
              </template>
              <span v-else class="pricing-dash">—</span>
            </td>
            <td class="pricing-price-cell" data-price="output">
              <template v-if="modelBillingMode(model) === 'token'">
                <p>{{ formatModelPrice(model, 'output_price', unit, selectedGroup) }}</p>
                <span>/ {{ unit === 'M' ? '1M' : '1K' }} {{ t('tokens') }}</span>
              </template>
              <span v-else class="pricing-dash">—</span>
            </td>
            <td class="p-2"><span class="pricing-dash">—</span></td>
            <td class="p-2"><PricingBadgeList :items="modelTags(model)" /></td>
            <td class="p-2"><PricingBadgeList :items="modelEndpoints(model)" /></td>
            <td class="p-2"><PricingBadgeList :items="modelGroups(model)" group /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="models.length === 0" class="rounded-[10px] border border-dashed border-pricing p-12 text-center">
      <p class="text-sm font-medium">{{ t('No Models Found') }}</p>
      <p class="mt-2 text-sm text-pricing-muted">{{ t('No models match your current filters.') }}</p>
    </div>

    <div v-else class="flex flex-col gap-3 text-sm text-pricing-muted sm:flex-row sm:items-center sm:justify-between">
      <p>{{ t('Rows per page') }} <span class="text-pricing">{{ pageSize }}</span></p>
      <div class="flex items-center gap-3">
        <span>{{ t('Page') }} {{ page }} {{ t('of') }} {{ pageCount }}</span>
        <div class="flex gap-1">
          <button type="button" class="pricing-pagination-button" :disabled="page === 1" :aria-label="t('Previous page')" @click="page--">
            <Icon name="chevronLeft" size="sm" />
          </button>
          <button type="button" class="pricing-pagination-button" :disabled="page === pageCount" :aria-label="t('Next page')" @click="page++">
            <Icon name="chevronRight" size="sm" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import type { PricingCatalogueModel, TokenUnit } from './pricingPresentation'
import {
  formatModelFixedPrice,
  formatModelPrice,
  formatPlatformName,
  modelBillingMode,
  modelEndpoints,
  modelGroups,
  modelTags,
} from './pricingPresentation'

const props = withDefaults(
  defineProps<{
    models: PricingCatalogueModel[]
    unit: TokenUnit
    selectedGroup?: string
    pageSize?: number
  }>(),
  { selectedGroup: '', pageSize: 20 },
)

const emit = defineEmits<{ open: [model: PricingCatalogueModel] }>()
const { t } = useI18n()
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(props.models.length / props.pageSize)))
const pagedModels = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.models.slice(start, start + props.pageSize)
})

watch(
  () => [props.models, props.selectedGroup],
  () => { page.value = 1 },
)

const PricingBadgeList = defineComponent({
  props: { items: { type: Array as () => string[], required: true }, group: Boolean },
  setup(componentProps) {
    return () => {
      if (componentProps.items.length === 0) return h('span', { class: 'pricing-dash' }, '—')
      const visible = componentProps.items.slice(0, 2)
      return h('div', { class: 'flex min-w-0 flex-wrap gap-1.5' }, [
        ...visible.map((item) => h('span', { class: componentProps.group ? 'pricing-group-badge' : 'pricing-badge' }, item)),
        componentProps.items.length > 2
          ? h('span', { class: 'text-xs text-pricing-muted' }, `+${componentProps.items.length - 2}`)
          : null,
      ])
    }
  },
})
</script>
