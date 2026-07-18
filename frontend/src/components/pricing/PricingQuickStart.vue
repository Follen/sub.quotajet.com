<template>
  <section>
    <h2 class="pricing-section-title">{{ t('Quick start') }}</h2>
    <p class="mb-4 text-sm leading-6 text-pricing-muted">{{ t('Call this model through the public Sub2API-compatible endpoint.') }}</p>

    <div class="overflow-hidden rounded-xl border border-pricing bg-pricing-code">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-pricing px-3 py-2">
        <div class="flex gap-1">
          <button
            v-for="language in languages"
            :key="language.id"
            type="button"
            class="pricing-code-tab"
            :class="activeLanguage === language.id ? 'is-active' : ''"
            @click="activeLanguage = language.id"
          >
            {{ language.label }}
          </button>
        </div>
        <button
          type="button"
          data-testid="marketplace-copy-quick-start"
          class="pricing-control-button"
          @click="copyToClipboard(requestExample, t('modelMarketplace.quickStart.copied'))"
        >
          <Icon name="copy" size="xs" />
          {{ t('Copy') }}
        </button>
      </div>
      <pre data-testid="marketplace-quick-start-code" class="max-h-[420px] overflow-auto p-4 font-mono text-xs leading-6"><code>{{ requestExample }}</code></pre>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <RouterLink to="/keys" data-testid="marketplace-create-api-key" class="pricing-primary-button">
        {{ t('Create API key') }}
        <Icon name="arrowRight" size="sm" />
      </RouterLink>
      <span class="text-xs text-pricing-muted">{{ t('Replace $YOUR_API_KEY before sending the request.') }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useClipboard } from '@/composables/useClipboard'
import { normalizeMarketplaceApiOrigin, shellQuote } from './pricingQuickStart'

type SampleLanguage = 'curl' | 'python' | 'javascript'

const props = withDefaults(defineProps<{
  apiOrigin: string
  modelName: string
  endpoint?: string
}>(), { endpoint: '/v1/chat/completions' })

const { t } = useI18n()
const { copyToClipboard } = useClipboard()
const activeLanguage = ref<SampleLanguage>('curl')
const languages = [
  { id: 'curl' as const, label: 'curl' },
  { id: 'python' as const, label: 'Python' },
  { id: 'javascript' as const, label: 'JavaScript' },
]

const endpointUrl = computed(() => {
  const origin = normalizeMarketplaceApiOrigin(props.apiOrigin, window.location.origin)
  const endpoint = props.endpoint.startsWith('/') ? props.endpoint : `/${props.endpoint}`
  return `${origin || ''}${endpoint}`
})
const sdkBaseUrl = computed(() => {
  const url = new URL(endpointUrl.value)
  url.pathname = url.pathname.replace(/\/v1(?:beta)?(?:\/.*)?$/, '/v1')
  return url.toString().replace(/\/$/, '')
})

const requestBody = computed(() => JSON.stringify({
  model: props.modelName,
  messages: [{ role: 'user', content: 'Hello' }],
}, null, 2))
const isChatEndpoint = computed(() => /chat\/completions|responses|messages/.test(props.endpoint))

const rawRequestExample = computed(() => {
  if (activeLanguage.value === 'python') {
    if (!isChatEndpoint.value) return `import requests\n\nresponse = requests.post(\n    ${JSON.stringify(endpointUrl.value)},\n    headers={"Authorization": "Bearer $YOUR_API_KEY"},\n    json={"model": ${JSON.stringify(props.modelName)}, "input": "Hello"},\n)\n\nprint(response.json())`
    return `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="$YOUR_API_KEY",\n    base_url=${JSON.stringify(sdkBaseUrl.value)},\n)\n\nresponse = client.chat.completions.create(\n    model=${JSON.stringify(props.modelName)},\n    messages=[{"role": "user", "content": "Hello"}],\n)\n\nprint(response.choices[0].message.content)`
  }
  if (activeLanguage.value === 'javascript') {
    if (!isChatEndpoint.value) return `const response = await fetch(${JSON.stringify(endpointUrl.value)}, {\n  method: "POST",\n  headers: { Authorization: "Bearer $YOUR_API_KEY", "Content-Type": "application/json" },\n  body: JSON.stringify({ model: ${JSON.stringify(props.modelName)}, input: "Hello" }),\n});\n\nconsole.log(await response.json());`
    return `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: process.env.YOUR_API_KEY,\n  baseURL: ${JSON.stringify(sdkBaseUrl.value)},\n});\n\nconst response = await client.chat.completions.create({\n  model: ${JSON.stringify(props.modelName)},\n  messages: [{ role: "user", content: "Hello" }],\n});\n\nconsole.log(response.choices[0].message.content);`
  }
  return `curl ${shellQuote(endpointUrl.value)} \\\n+  -H "Authorization: Bearer $YOUR_API_KEY" \\\n+  -H "Content-Type: application/json" \\\n+  -d ${shellQuote(requestBody.value)}`
})
const requestExample = computed(() => rawRequestExample.value.replace(/\n\+\x20{2}/g, '\n  '))
</script>
