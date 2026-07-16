import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CostVisibilityFeature from '../CostVisibilityFeature.vue'
import HomeBrandIcon from '../HomeBrandIcon.vue'
import HomeCallToAction from '../HomeCallToAction.vue'
import HomeHero from '../HomeHero.vue'
import ModelRoutingFeature from '../ModelRoutingFeature.vue'
import PrivacyFeature from '../PrivacyFeature.vue'
import ReliabilityFeature from '../ReliabilityFeature.vue'
import ToolsMarquee from '../ToolsMarquee.vue'
import { modelNodes, toolNodes } from '../homeContent'
import { useLandingReveal } from '../useLandingReveal'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      locale: ref('en'),
      t: (key: string) => key,
    }),
  }
})

const metrics = { requests: '48,219,037', users: '18,287', uptime: '99d 0h 05m' }

const global = {
  stubs: {
    RouterLink: {
      props: ['to'],
      template: '<a :to="to" :href="to"><slot /></a>',
    },
    RelayMachineVisual: {
      template: '<canvas class="landing-metal-canvas" />',
    },
  },
}

describe('landing section contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('gives every section its stable integration marker', () => {
    expect(mount(HomeHero, { props: { isAuthenticated: false, metrics }, global }).get('[data-home-section]').attributes('data-home-section')).toBe('hero')
    expect(mount(PrivacyFeature, { props: { isAuthenticated: false }, global }).get('[data-home-section]').attributes('data-home-section')).toBe('privacy')
    expect(mount(ModelRoutingFeature, { props: { isAuthenticated: false }, global }).get('[data-home-section]').attributes('data-home-section')).toBe('models')
    expect(mount(CostVisibilityFeature, { global }).get('[data-home-section]').attributes('data-home-section')).toBe('pricing')
    expect(mount(ReliabilityFeature, { props: { isAuthenticated: false }, global }).get('[data-home-section]').attributes('data-home-section')).toBe('reliability')
    expect(mount(ToolsMarquee, { global }).get('[data-home-section]').attributes('data-home-section')).toBe('tools')
    expect(mount(HomeCallToAction, { props: { isAuthenticated: false, docUrl: '' }, global }).get('[data-home-section]').attributes('data-home-section')).toBe('cta')
  })

  it('maps signed-out and signed-in primary actions correctly', () => {
    expect(mount(HomeHero, { props: { isAuthenticated: false, metrics }, global }).get('[data-primary-cta]').attributes('to')).toBe('/register')
    expect(mount(HomeHero, { props: { isAuthenticated: true, metrics }, global }).get('[data-primary-cta]').attributes('to')).toBe('/dashboard')
    expect(mount(HomeCallToAction, { props: { isAuthenticated: false, docUrl: '' }, global }).get('[data-primary-cta]').attributes('to')).toBe('/register')
    expect(mount(HomeCallToAction, { props: { isAuthenticated: true, docUrl: '' }, global }).get('[data-primary-cta]').attributes('to')).toBe('/dashboard')
  })

  it('keeps the hero metric grid and relay visual placement', () => {
    const wrapper = mount(HomeHero, { props: { isAuthenticated: false, metrics }, global })

    expect(wrapper.findAll('[data-home-metric]').map((node) => node.text())).toEqual([
      '48,219,037landing.hero.metrics.requests',
      '18,287landing.hero.metrics.users',
      '99d 0h 05mlanding.hero.metrics.uptime',
    ])
    expect(wrapper.find('.landing-metal-canvas').exists()).toBe(true)
    expect(wrapper.get('[data-secondary-cta]').attributes('href')).toBe('#models')
  })

  it('preserves the exact ordered model and tool data', () => {
    expect(modelNodes).toEqual([
      { icon: 'OpenAI.Color', label: 'OpenAI' },
      { icon: 'Claude.Color', label: 'Claude' },
      { icon: 'Gemini.Color', label: 'Gemini' },
      { icon: 'DeepSeek.Color', label: 'DeepSeek' },
      { icon: 'Qwen.Color', label: 'Qwen' },
      { icon: 'Grok.Color', label: 'Grok' },
      { icon: 'Doubao.Color', label: 'Doubao' },
      { icon: 'Moonshot.Color', label: 'Moonshot' },
      { icon: 'Zhipu.Color', label: 'GLM' },
      { icon: 'Mistral.Color', label: 'Mistral' },
    ])
    expect(toolNodes).toEqual([
      { icon: 'Codex.Color', label: 'Codex' },
      { icon: 'ClaudeCode.Color', label: 'Claude Code' },
      { icon: 'Cursor.Color', label: 'Cursor' },
      { icon: 'Cline.Color', label: 'Cline' },
      { icon: 'OpenWebUI.Color', label: 'Open WebUI' },
      { icon: 'LobeHub.Color', label: 'LobeChat' },
      { icon: 'Dify.Color', label: 'Dify' },
      { icon: 'CherryStudio.Color', label: 'Cherry Studio' },
      { icon: 'ComfyUI.Color', label: 'ComfyUI' },
      { icon: 'LangChain.Color', label: 'LangChain' },
    ])
  })

  it.each([...modelNodes, ...toolNodes])('renders $icon from source SVG data', ({ icon }) => {
    const wrapper = mount(HomeBrandIcon, { props: { name: icon } })
    const svg = wrapper.get('svg')

    expect(svg.attributes('viewBox')).toBeTruthy()
    expect(svg.findAll('path').some((path) => Boolean(path.attributes('d')))).toBe(true)
    expect(wrapper.find('[data-icon-fallback]').exists()).toBe(false)
  })

  it('preserves the four source visual compositions', () => {
    const privacy = mount(PrivacyFeature, { props: { isAuthenticated: false }, global })
    const models = mount(ModelRoutingFeature, { props: { isAuthenticated: false }, global })
    const pricing = mount(CostVisibilityFeature, { global })
    const reliability = mount(ReliabilityFeature, { props: { isAuthenticated: false }, global })

    expect(privacy.findAll('.landing-privacy-map path')).toHaveLength(2)
    expect(privacy.findAll('.landing-privacy-stream-in span')).toHaveLength(4)
    expect(privacy.findAll('.landing-privacy-stream-out span')).toHaveLength(5)
    expect(models.findAll('.landing-model-node')).toHaveLength(10)
    expect(models.get('.landing-model-core-logo').attributes('src')).toBe('/logo.png')
    expect(pricing.findAll('.landing-price-fill')).toHaveLength(2)
    expect(pricing.findAll('.landing-usage-events i')).toHaveLength(12)
    expect(reliability.findAll('.landing-stability-row')).toHaveLength(3)
  })

  it('duplicates the tools once and hides only the duplicate from assistive technology', () => {
    const wrapper = mount(ToolsMarquee, { global })
    const groups = wrapper.findAll('[data-tools-copy]')

    expect(groups).toHaveLength(2)
    expect(groups[0].attributes('aria-hidden')).toBeUndefined()
    expect(groups[1].attributes('aria-hidden')).toBe('true')
    expect(groups[0].findAll('.landing-agent-pill')).toHaveLength(toolNodes.length)
    expect(groups[1].findAll('.landing-agent-pill')).toHaveLength(toolNodes.length)
  })

  it('emits only a sanitized Docs URL', () => {
    const valid = mount(HomeCallToAction, {
      props: { isAuthenticated: false, docUrl: ' https://docs.example.com/guide ' },
      global,
    })
    const unsafe = mount(HomeCallToAction, {
      props: { isAuthenticated: false, docUrl: 'javascript:alert(1)' },
      global,
    })

    expect(valid.get('[data-doc-link]').attributes('href')).toBe('https://docs.example.com/guide')
    expect(valid.get('[data-doc-link]').attributes('rel')).toBe('noopener noreferrer')
    expect(unsafe.find('[data-doc-link]').exists()).toBe(false)
  })
})

describe('useLandingReveal', () => {
  it('shows all reveal nodes immediately under reduced motion', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    const component = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useLandingReveal(root)
        return { root }
      },
      template: '<main ref="root"><section data-landing-reveal /><section data-landing-reveal /></main>',
    })

    const wrapper = mount(component)
    await nextTick()

    expect(wrapper.findAll('[data-landing-reveal]').every((node) => node.attributes('data-visible') === 'true')).toBe(true)
  })

  it('observes reveal nodes and disconnects on unmount', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
    const observe = vi.fn()
    const unobserve = vi.fn()
    const disconnect = vi.fn()
    let callback: IntersectionObserverCallback | undefined

    globalThis.IntersectionObserver = class {
      constructor(nextCallback: IntersectionObserverCallback) {
        callback = nextCallback
      }
      observe = observe
      unobserve = unobserve
      disconnect = disconnect
      root = null
      rootMargin = ''
      thresholds = [0.12]
      takeRecords = () => []
    } as unknown as typeof IntersectionObserver

    const component = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        useLandingReveal(root)
        return { root }
      },
      template: '<main ref="root"><section data-landing-reveal /></main>',
    })

    const wrapper = mount(component)
    await nextTick()
    const node = wrapper.get('[data-landing-reveal]').element
    callback?.([{ isIntersecting: true, target: node } as IntersectionObserverEntry], {} as IntersectionObserver)

    expect(observe).toHaveBeenCalledWith(node)
    expect(wrapper.get('[data-landing-reveal]').attributes('data-visible')).toBe('true')
    expect(unobserve).toHaveBeenCalledWith(node)

    wrapper.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })
})
