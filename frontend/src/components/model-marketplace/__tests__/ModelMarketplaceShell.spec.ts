import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

import ModelMarketplaceShell from '../ModelMarketplaceShell.vue'
import type { PublicModelMarketplace } from '@/api/modelMarketplace'

const marketplace: PublicModelMarketplace = {
  version: 'v1',
  generated_at: '2026-07-18T00:00:00Z',
  platforms: [
    {
      name: 'OpenAI',
      models: [
        { name: 'gpt-4.1', providers: [] },
        { name: 'gpt-5', providers: [] },
      ],
    },
    {
      name: 'Anthropic',
      models: [{ name: 'claude-sonnet-4', providers: [] }],
    },
  ],
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/models', component: { template: '<div />' } }],
  })
}

describe('ModelMarketplaceShell', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    router = createTestRouter()
    await router.push('/models?model=gpt-4.1')
    await router.isReady()
  })

  it('renders public platform tabs from the marketplace response', () => {
    const wrapper = mount(ModelMarketplaceShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    expect(wrapper.get('[data-testid="marketplace-platform-OpenAI"]').text()).toBe('OpenAI')
    expect(wrapper.get('[data-testid="marketplace-platform-Anthropic"]').text()).toBe('Anthropic')
  })

  it('switches models and keeps the selected model in the URL query', async () => {
    const wrapper = mount(ModelMarketplaceShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    await wrapper.get('[data-testid="marketplace-model-gpt-5"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('gpt-5')
    expect(router.currentRoute.value.query.model).toBe('gpt-5')

    await wrapper.get('[data-testid="marketplace-platform-Anthropic"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('claude-sonnet-4')
    expect(router.currentRoute.value.query.model).toBe('claude-sonnet-4')
  })

  it('shows the public empty state when no models are available', () => {
    const wrapper = mount(ModelMarketplaceShell, {
      props: {
        marketplace: {
          version: 'v1',
          generated_at: '2026-07-18T00:00:00Z',
          platforms: [],
        },
      },
      global: { plugins: [router] },
    })

    expect(wrapper.get('[data-testid="marketplace-empty"]').text()).toContain('modelMarketplace.empty.title')
  })
})
