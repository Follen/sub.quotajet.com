<template>
  <nav class="border-b border-pricing" :aria-label="t('Model detail navigation')">
    <div class="flex items-center gap-6 overflow-x-auto">
      <button
        v-for="section in sections"
        :key="section.id"
        type="button"
        role="tab"
        :data-testid="`pricing-detail-tab-${section.id}`"
        :aria-selected="modelValue === section.id"
        class="pricing-detail-tab"
        :class="modelValue === section.id ? 'is-active' : ''"
        @click="emit('update:modelValue', section.id)"
      >
        <Icon :name="section.icon" size="xs" />
        {{ t(section.label) }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

export type PricingDetailSection = 'overview' | 'api'

defineProps<{ modelValue: PricingDetailSection }>()
const emit = defineEmits<{ 'update:modelValue': [section: PricingDetailSection] }>()
const { t } = useI18n()

const sections = [
  { id: 'overview' as const, label: 'Overview', icon: 'infoCircle' as const },
  { id: 'api' as const, label: 'API', icon: 'terminal' as const },
]
</script>
