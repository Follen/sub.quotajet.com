<template>
  <aside class="rounded-lg border border-[var(--landing-border)] p-4">
    <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.quickStart.eyebrow') }}</p>
    <h3 class="mt-1 text-base font-semibold text-[var(--landing-fg)]">{{ t('modelMarketplace.quickStart.title') }}</h3>
    <p class="mt-2 text-sm leading-6 text-[var(--landing-fg-soft)]">{{ t('modelMarketplace.quickStart.description') }}</p>

    <div class="mt-4 overflow-hidden rounded-md border border-[var(--landing-border)] bg-[var(--landing-surface)]">
      <div class="flex items-center justify-between border-b border-[var(--landing-border)] px-3 py-2">
        <span class="font-mono text-[11px] text-slate-500">curl</span>
        <button
          type="button"
          data-testid="marketplace-copy-quick-start"
          class="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-violet-400/60 hover:text-violet-300"
          @click="copyToClipboard(requestExample, t('modelMarketplace.quickStart.copied'))"
        >
          {{ t('modelMarketplace.quickStart.copy') }}
        </button>
      </div>
      <pre data-testid="marketplace-quick-start-code" class="overflow-x-auto p-3 text-xs leading-6 text-slate-300"><code>{{ requestExample }}</code></pre>
    </div>

    <RouterLink
      to="/keys"
      data-testid="marketplace-create-api-key"
      class="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--landing-accent)] px-3 py-2 text-sm font-semibold text-[var(--landing-accent-contrast)] transition-opacity hover:opacity-85"
    >
      {{ t('modelMarketplace.quickStart.createKey') }}
    </RouterLink>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useClipboard } from '@/composables/useClipboard'
import { normalizeMarketplaceApiOrigin, shellQuote } from './pricingQuickStart'

const props = defineProps<{
  apiOrigin: string
  modelName: string
}>()

const { t } = useI18n()
const { copyToClipboard } = useClipboard()

const apiBase = computed(() => {
  const origin = normalizeMarketplaceApiOrigin(props.apiOrigin, window.location.origin)
  return origin ? `${origin}/v1` : '/v1'
})
const requestBody = computed(() => JSON.stringify({
  model: props.modelName,
  messages: [{ role: 'user', content: 'Hello' }],
}, null, 2))
const requestExample = computed(() => `curl ${shellQuote(`${apiBase.value}/chat/completions`)} \\
  -H "Authorization: Bearer $YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d ${shellQuote(requestBody.value)}`)

</script>
