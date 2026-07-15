import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RegisterView from '@/views/auth/RegisterView.vue'

const { getPublicSettingsMock, pushMock } = vi.hoisted(() => ({
  getPublicSettingsMock: vi.fn(),
  pushMock: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({
    t: (key: string, params?: { siteName?: string }) =>
      key === 'auth.signUpToStart' ? `Sign up for ${params?.siteName}` : key,
    locale: { value: 'en' },
  }),
}))

vi.mock('@/stores', () => ({
  useAuthStore: () => ({ register: vi.fn() }),
  useAppStore: () => ({ showError: vi.fn(), showSuccess: vi.fn(), showWarning: vi.fn() }),
}))

vi.mock('@/api/auth', () => ({
  getPublicSettings: (...args: unknown[]) => getPublicSettingsMock(...args),
  isWeChatWebOAuthEnabled: () => false,
  validatePromoCode: vi.fn(),
  validateInvitationCode: vi.fn(),
}))

describe('RegisterView', () => {
  afterEach(() => {
    getPublicSettingsMock.mockReset()
    pushMock.mockReset()
  })

  it('uses QuotaJet without an error when public settings omit site_name', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    getPublicSettingsMock.mockResolvedValue({
      registration_enabled: true,
      email_verify_enabled: false,
      promo_code_enabled: false,
      invitation_code_enabled: false,
      turnstile_enabled: false,
      turnstile_site_key: '',
      linuxdo_oauth_enabled: false,
      oidc_oauth_enabled: false,
      oidc_oauth_provider_name: 'OIDC',
      github_oauth_enabled: false,
      google_oauth_enabled: false,
      registration_email_suffix_whitelist: [],
    })

    const wrapper = mount(RegisterView, {
      global: {
        stubs: {
          AuthLayout: { template: '<div><slot /><slot name="footer" /></div>' },
          RouterLink: { template: '<a><slot /></a>' },
          LinuxDoOAuthSection: true,
          OidcOAuthSection: true,
          WechatOAuthSection: true,
          EmailOAuthButtons: true,
          LoginAgreementPrompt: true,
          Icon: true,
          TurnstileWidget: true,
          transition: false,
        },
      },
    })

    await flushPromises()

    expect(consoleError).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Sign up for QuotaJet')
    consoleError.mockRestore()
  })
})
