<template>
  <nav class="border-b border-[var(--landing-border)]" :aria-label="t('modelMarketplace.detailNavigation')">
    <label class="sr-only" for="marketplace-detail-section">{{ t('modelMarketplace.detailNavigation') }}</label>
    <select
      id="marketplace-detail-section"
      :value="modelValue"
      class="mb-3 w-full rounded-md border border-[var(--landing-border)] bg-transparent px-3 py-2 text-sm text-[var(--landing-fg)] md:hidden"
      @change="selectSection"
    >
      <option v-for="section in sections" :key="section.id" :value="section.id">{{ t(section.label) }}</option>
    </select>

    <div class="hidden items-center gap-6 md:flex">
      <button
        v-for="section in sections"
        :key="section.id"
        :data-testid="`marketplace-detail-nav-${section.id}`"
        type="button"
        class="flex items-center border-b-2 px-0.5 pb-3 text-sm transition-colors"
        :class="modelValue === section.id
          ? 'border-[var(--landing-fg)] text-[var(--landing-fg)]'
          : 'border-transparent text-[var(--landing-fg-soft)] hover:text-[var(--landing-fg)]'"
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
  { id: 'providers', label: 'modelMarketplace.sections.overview.title' },
  { id: 'performance', label: 'modelMarketplace.sections.performance.title' },
  { id: 'apps', label: 'modelMarketplace.sections.api.title' },
]

function selectSection(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value as DetailSection)
}
</script>
