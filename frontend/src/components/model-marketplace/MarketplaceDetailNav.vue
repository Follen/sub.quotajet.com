<template>
  <nav class="border-b border-slate-800 pb-4 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-4" :aria-label="t('modelMarketplace.detailNavigation')">
    <label class="sr-only" for="marketplace-detail-section">{{ t('modelMarketplace.detailNavigation') }}</label>
    <select
      id="marketplace-detail-section"
      :value="modelValue"
      class="w-full rounded-md border border-white/[0.1] bg-[#111318] px-3 py-2 text-sm text-slate-100 xl:hidden"
      @change="selectSection"
    >
      <option v-for="section in sections" :key="section.id" :value="section.id">{{ t(section.label) }}</option>
    </select>

    <div class="hidden space-y-1 xl:block">
      <p class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {{ t('modelMarketplace.detailNavigation') }}
      </p>
      <button
        v-for="section in sections"
        :key="section.id"
        :data-testid="`marketplace-detail-nav-${section.id}`"
        type="button"
        class="flex w-full items-center rounded-md border px-3 py-2 text-left text-sm transition-colors"
        :class="modelValue === section.id
          ? 'border-lime-400/60 bg-lime-400/10 text-lime-300'
          : 'border-transparent text-slate-400 hover:border-white/[0.12] hover:bg-[#20242c] hover:text-slate-100'"
        @click="emit('update:modelValue', section.id)"
      >
        {{ t(section.label) }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

type DetailSection = 'providers' | 'pricing' | 'performance' | 'uptime' | 'benchmarks' | 'apps' | 'activity'

defineProps<{ modelValue: DetailSection }>()

const emit = defineEmits<{ 'update:modelValue': [section: DetailSection] }>()
const { t } = useI18n()

const sections: Array<{ id: DetailSection; label: string }> = [
  { id: 'providers', label: 'modelMarketplace.sections.providers.title' },
  { id: 'pricing', label: 'modelMarketplace.sections.pricing.title' },
  { id: 'performance', label: 'modelMarketplace.sections.performance.title' },
  { id: 'uptime', label: 'modelMarketplace.sections.uptime.title' },
  { id: 'benchmarks', label: 'modelMarketplace.sections.benchmarks.title' },
  { id: 'apps', label: 'modelMarketplace.sections.apps.title' },
  { id: 'activity', label: 'modelMarketplace.sections.activity.title' },
]

function selectSection(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value as DetailSection)
}
</script>
