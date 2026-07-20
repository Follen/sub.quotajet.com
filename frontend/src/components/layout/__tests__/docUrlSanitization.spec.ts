import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const { appStoreState } = vi.hoisted(() => ({
  appStoreState: { contactInfo: '', docUrl: '', toggleMobileSidebar: vi.fn(), cachedPublicSettings: {} },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ name: 'PublicStatus', params: {}, meta: {} }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/stores', () => ({
  useAppStore: () => appStoreState,
  useAuthStore: () => ({ user: null, isAdmin: false, isSimpleMode: false }),
  useOnboardingStore: () => ({ replay: vi.fn() }),
}))
vi.mock('@/stores/adminSettings', () => ({ useAdminSettingsStore: () => ({ customMenuItems: [] }) }))
vi.mock('@/components/common/LocaleSwitcher.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/common/SubscriptionProgressMini.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/common/AnnouncementBell.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/icons/Icon.vue', () => ({ default: { template: '<span />' } }))

import AppHeader from '../AppHeader.vue'

const dir = dirname(fileURLToPath(import.meta.url))
const homeViewSource = readFileSync(resolve(dir, '../../../views/HomeView.vue'), 'utf8')
const keyUsageViewSource = readFileSync(resolve(dir, '../../../views/KeyUsageView.vue'), 'utf8')

function mountPublicHeader(props: { publicDocUrl?: string } = {}) {
  return mount(AppHeader, {
    props: { publicPage: true, ...props },
    global: { stubs: { 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  })
}

describe('doc_url sanitization', () => {
  it('uses the configured app documentation URL when no public override is supplied', () => {
    appStoreState.docUrl = ' https://docs.example.com/app-guide '

    expect(mountPublicHeader().get('a[href="https://docs.example.com/app-guide"]').exists()).toBe(true)
  })

  it('prefers a sanitized public documentation URL and suppresses unsafe URLs', () => {
    appStoreState.docUrl = 'https://docs.example.com/app-guide'

    expect(mountPublicHeader({ publicDocUrl: ' https://docs.example.com/public-guide ' })
      .get('a[href="https://docs.example.com/public-guide"]').exists()).toBe(true)
    expect(mountPublicHeader({ publicDocUrl: 'javascript:alert(1)' }).find('a[href^="javascript:"]').exists()).toBe(false)
  })

  it('HomeView sanitizes its configured documentation URL', () => {
    expect(homeViewSource).toContain("import { sanitizeUrl } from '@/utils/url'")
    expect(homeViewSource).toContain('sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl')
  })

  it('KeyUsageView sanitizes its configured documentation URL', () => {
    expect(keyUsageViewSource).toContain("import { sanitizeUrl } from '@/utils/url'")
    expect(keyUsageViewSource).toContain('sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl')
  })
})
