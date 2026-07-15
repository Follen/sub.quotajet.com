import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LegalDocumentView from '@/views/public/LegalDocumentView.vue'

const getPublicSettingsMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/api/auth', () => ({
  getPublicSettings: (...args: unknown[]) => getPublicSettingsMock(...args),
}))

describe('LegalDocumentView', () => {
  beforeEach(() => {
    getPublicSettingsMock.mockReset()
  })

  it('uses QuotaJet defaults when public brand settings are blank', async () => {
    getPublicSettingsMock.mockResolvedValue({
      site_name: '   ',
      site_logo: '   ',
    })

    const wrapper = mount(LegalDocumentView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          Icon: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('QuotaJet')
    expect(wrapper.get('img').attributes('src')).toBe('/logo.png')
  })
})
