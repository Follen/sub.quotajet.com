import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copied: { value: false }, copyToClipboard: vi.fn().mockResolvedValue(true) }),
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
        { name: 'shared-model', providers: [] },
      ],
    },
    {
      name: 'Anthropic',
      models: [
        { name: 'claude-sonnet-4', providers: [] },
        { name: 'shared-model', providers: [] },
      ],
    },
  ],
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/pricing', component: { template: '<div />' } },
      { path: '/keys', component: { template: '<div />' } },
    ],
  })
}

describe('ModelMarketplaceShell', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    router = createTestRouter()
    await router.push('/pricing?model=gpt-4.1')
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

  it('normalizes a missing or invalid model query to the visible model', async () => {
    await router.push('/pricing?ref=marketplace')
    const wrapper = mount(ModelMarketplaceShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('gpt-4.1')
    expect(router.currentRoute.value.query).toMatchObject({
      model: 'gpt-4.1',
      platform: 'OpenAI',
      ref: 'marketplace',
    })
  })

  it('uses the platform query to distinguish duplicate model names', async () => {
    await router.push('/pricing?platform=Anthropic&model=shared-model')
    const wrapper = mount(ModelMarketplaceShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    await flushPromises()

    expect(wrapper.get('[data-testid="marketplace-platform-Anthropic"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.find('[data-testid="marketplace-model-claude-sonnet-4"]').exists()).toBe(true)
  })

  it('passes the target platform when switching to a duplicate first model', async () => {
    const duplicateFirstMarketplace: PublicModelMarketplace = {
      ...marketplace,
      platforms: [
        {
          name: 'OpenAI',
          models: [{ name: 'shared-first', providers: [] }, ...marketplace.platforms[0].models],
        },
        {
          name: 'Anthropic',
          models: [{ name: 'shared-first', providers: [] }, ...marketplace.platforms[1].models],
        },
      ],
    }
    await router.push('/pricing?platform=OpenAI&model=shared-first')
    const wrapper = mount(ModelMarketplaceShell, {
      props: { marketplace: duplicateFirstMarketplace },
      global: { plugins: [router] },
    })

    await flushPromises()
    await wrapper.get('[data-testid="marketplace-platform-Anthropic"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toMatchObject({
      platform: 'Anthropic',
      model: 'shared-first',
    })
    expect(wrapper.get('[data-testid="marketplace-platform-Anthropic"]').attributes('aria-selected')).toBe('true')
  })

  it('filters the model list by a case-insensitive search query', async () => {
    const wrapper = mount(ModelMarketplaceShell, {
      props: { marketplace },
      global: { plugins: [router] },
    })

    const search = wrapper.get('[data-testid="marketplace-model-search"]')
    await search.setValue('GPT-5')

    expect(wrapper.find('[data-testid="marketplace-model-gpt-5"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="marketplace-model-gpt-4.1"]').exists()).toBe(false)
  })
})
