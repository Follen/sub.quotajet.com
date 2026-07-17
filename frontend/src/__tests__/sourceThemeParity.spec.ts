import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { mount } from '@vue/test-utils'
import postcss from 'postcss'
import tailwindcss, { type Config } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'

import Toggle from '@/components/common/Toggle.vue'
import tailwindConfig from '../../tailwind.config.js'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFrontendFile = (path: string) => readFileSync(resolve(frontendRoot, path), 'utf8')

const globalStyleSource = readFrontendFile('src/style.css')
const onboardingSource = readFrontendFile('src/styles/onboarding.css')
const appLayoutSource = readFrontendFile('src/components/layout/AppLayout.vue')
const authLayoutSource = readFrontendFile('src/components/layout/AuthLayout.vue')
const dateRangePickerSource = readFrontendFile('src/components/common/DateRangePicker.vue')
const accountTestModalSources = [
  readFrontendFile('src/components/account/AccountTestModal.vue'),
  readFrontendFile('src/components/admin/account/AccountTestModal.vue')
]
const keyUsageSource = readFrontendFile('src/views/KeyUsageView.vue')
const legalDocumentSource = readFrontendFile('src/views/public/LegalDocumentView.vue')
const notFoundSource = readFrontendFile('src/views/NotFoundView.vue')
const oauthCallbackSource = readFrontendFile('src/views/auth/OAuthCallbackView.vue')
const wechatPaymentCallbackSource = readFrontendFile('src/views/auth/WechatPaymentCallbackView.vue')
const paymentResultSource = readFrontendFile('src/views/user/PaymentResultView.vue')
const stripePaymentSource = readFrontendFile('src/views/user/StripePaymentView.vue')
const accountsSource = readFrontendFile('src/views/admin/AccountsView.vue')
const confirmDialogSource = readFrontendFile('src/components/common/ConfirmDialog.vue')
const userAllowedGroupsSource = readFrontendFile('src/components/admin/user/UserAllowedGroupsModal.vue')
const createAccountSource = readFrontendFile('src/components/account/CreateAccountModal.vue')
const editAccountSource = readFrontendFile('src/components/account/EditAccountModal.vue')
const balanceNotifySource = readFrontendFile('src/components/user/profile/ProfileBalanceNotifyCard.vue')
const opsDashboardSource = readFrontendFile('src/views/admin/ops/OpsDashboard.vue')
const settingsSource = readFrontendFile('src/views/admin/SettingsView.vue')
const redeemSource = readFrontendFile('src/views/user/RedeemView.vue')
const riskControlSource = readFrontendFile('src/views/admin/RiskControlView.vue')
const platformColorsSource = readFrontendFile('src/utils/platformColors.ts')

const colors = tailwindConfig.theme.extend.colors as Record<string, Record<string, string>>
const primaryScale = colors.primary
const darkScale = colors.dark

const sourceFiles = import.meta.glob('../**/*.{css,ts,vue}', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>
const applicationSource = Object.entries(sourceFiles)
  .filter(([path]) => !path.endsWith('/sourceThemeParity.spec.ts'))
  .map(([, source]) => source)
  .join('\n')

let compiledGlobalStyle = ''

beforeAll(async () => {
  const contractConfig = {
    ...tailwindConfig,
    content: [
      {
        raw: '<main class="card bg-surface-canvas text-content-muted"><aside class="sidebar"></aside><div class="dropdown modal-content"></div><button class="btn btn-primary"><span class="rounded-full bg-white"></span></button></main>',
        extension: 'html'
      }
    ]
  } as Config

  compiledGlobalStyle = (
    await postcss([tailwindcss(contractConfig)]).process(globalStyleSource, { from: undefined })
  ).css
})

function neutralOklchContrast(firstLightness: number, secondLightness: number) {
  const firstLuminance = firstLightness ** 3
  const secondLuminance = secondLightness ** 3
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function staticPrimarySwitchViolations() {
  const primaryTrackPattern = /(?:^|[\s'"`])bg-primary-(?:500|600)(?=$|[\s'"`/])/m
  const buttonPattern = /<button\b[\s\S]*?<\/button>/g
  const plainClassPattern = /(?:^|\s)class\s*=\s*(["'])([^"']*)\1/g
  const boundClassPattern = /:class\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  const translatedThumbPattern = /\btranslate-x-([^\s'"`,\]]+)/g
  const isWhiteRoundedClassList = (classes: string) => {
    const tokens = classes.split(/\s+/)
    return tokens.includes('rounded-full') && tokens.includes('bg-white')
  }

  return Object.entries(sourceFiles).flatMap(([path, source]) =>
    Array.from(source.matchAll(buttonPattern)).flatMap((match) => {
      const block = match[0]
      const hasPlainStaticWhiteThumb = Array.from(block.matchAll(plainClassPattern)).some(
        ([, , classes]) => isWhiteRoundedClassList(classes)
      )
      const hasBoundStaticWhiteThumb = Array.from(block.matchAll(boundClassPattern)).some(
        ([, doubleQuotedBinding, singleQuotedBinding]) => {
          const binding = doubleQuotedBinding ?? singleQuotedBinding
          const literalPattern = doubleQuotedBinding === undefined ? /"([^"]*)"/g : /'([^']*)'/g
          return Array.from(binding.matchAll(literalPattern)).some(([, classes]) =>
            isWhiteRoundedClassList(classes)
          )
        }
      )
      const hasActiveTranslation = Array.from(block.matchAll(translatedThumbPattern)).some(
        ([, distance]) => distance !== '0'
      )
      if (
        !primaryTrackPattern.test(block) ||
        (!hasPlainStaticWhiteThumb && !hasBoundStaticWhiteThumb) ||
        !hasActiveTranslation
      ) {
        return []
      }

      const line = source.slice(0, match.index ?? 0).split('\n').length
      return [`${path}:${line}`]
    })
  )
}

describe('source-aligned global theme', () => {
  it('maps source surface roles to the visible canvas and sidebar consumers', () => {
    expect(colors.surface).toEqual({
      canvas: 'oklch(var(--qj-surface-canvas) / <alpha-value>)',
      sidebar: 'oklch(var(--qj-surface-sidebar) / <alpha-value>)',
      card: 'oklch(var(--qj-surface-card) / <alpha-value>)',
      popover: 'oklch(var(--qj-surface-popover) / <alpha-value>)',
      accent: 'oklch(var(--qj-surface-accent) / <alpha-value>)'
    })
    expect(globalStyleSource).toContain('--qj-surface-canvas: 0.985 0 0;')
    expect(globalStyleSource).toContain('--qj-surface-canvas: 0.235 0 0;')
    expect(globalStyleSource).toContain('--qj-surface-sidebar: 0.225 0 0;')
    expect(globalStyleSource).toContain('@apply w-64 bg-surface-sidebar;')

    for (const source of [
      appLayoutSource,
      authLayoutSource,
      keyUsageSource,
      legalDocumentSource,
      notFoundSource,
      oauthCallbackSource,
      wechatPaymentCallbackSource,
      paymentResultSource,
      stripePaymentSource,
      opsDashboardSource
    ]) {
      expect(source).toContain('bg-surface-canvas')
    }
    expect(appLayoutSource).not.toContain('mesh-gradient')
    expect(compiledGlobalStyle).toContain(
      'background-color: oklch(var(--qj-surface-sidebar) / var(--tw-bg-opacity, 1))'
    )
  })

  it('keeps the numeric dark scale for surfaces and separates foreground and skeleton roles', () => {
    expect(darkScale).toEqual({
      50: 'oklch(0.985 0 0 / <alpha-value>)',
      100: 'oklch(0.965 0 0 / <alpha-value>)',
      200: 'oklch(0.9 0 0 / <alpha-value>)',
      300: 'oklch(0.78 0 0 / <alpha-value>)',
      400: 'oklch(0.68 0 0 / <alpha-value>)',
      500: 'oklch(0.365 0 0 / <alpha-value>)',
      600: 'oklch(0.335 0 0 / <alpha-value>)',
      700: 'oklch(0.305 0 0 / <alpha-value>)',
      800: 'oklch(0.285 0 0 / <alpha-value>)',
      900: 'oklch(0.235 0 0 / <alpha-value>)',
      950: 'oklch(0.225 0 0 / <alpha-value>)'
    })
    expect(colors.content.muted).toBe('oklch(var(--qj-content-muted) / <alpha-value>)')
    expect(globalStyleSource).toContain('--qj-content-muted: 0.78 0 0;')
    expect(applicationSource).not.toMatch(/dark:(?:placeholder:)?text-dark-500/)
    expect(keyUsageSource).toContain(
      'oklch(var(--qj-skeleton-base)) 25%, oklch(var(--qj-skeleton-highlight)) 50%'
    )
    expect(keyUsageSource).not.toMatch(/#334155|#1e293b/)
  })

  it('meets contrast thresholds for text and inverted controls in dark mode', () => {
    for (const surfaceLightness of [0.225, 0.235, 0.285, 0.305]) {
      expect(neutralOklchContrast(0.78, surfaceLightness)).toBeGreaterThanOrEqual(4.5)
    }
    expect(neutralOklchContrast(0.155, 0.9)).toBeGreaterThanOrEqual(3)
    expect(neutralOklchContrast(0.965, 0.335)).toBeGreaterThanOrEqual(3)
    expect(neutralOklchContrast(0.155, 0.965)).toBeGreaterThanOrEqual(4.5)
  })

  it('compiles the shared primary button to theme-aware foreground and background colors', () => {
    const buttonBlock = compiledGlobalStyle.match(/\.btn-primary\s*\{[^}]+\}/)?.[0]
    expect(primaryScale[500]).toBe('oklch(var(--qj-primary-500) / <alpha-value>)')
    expect(buttonBlock).toContain(
      'background-color: oklch(var(--qj-primary-500) / var(--tw-bg-opacity, 1))'
    )
    expect(buttonBlock).toContain('color: oklch(var(--qj-primary-50) / var(--tw-text-opacity, 1))')
    expect(buttonBlock).not.toContain('linear-gradient')
  })

  it('compiles shared card and popover surfaces from semantic roles', () => {
    const compiledBlocks = (className: string) =>
      Array.from(compiledGlobalStyle.matchAll(new RegExp(`\\.${className}\\s*\\{[^}]+\\}`, 'g')))
        .map((match) => match[0])
        .join('\n')
    const cardBlock = compiledBlocks('card')
    const dropdownBlock = compiledBlocks('dropdown')
    const modalBlock = compiledBlocks('modal-content')

    expect(cardBlock).toContain(
      'background-color: oklch(var(--qj-surface-card) / var(--tw-bg-opacity, 1))'
    )
    for (const block of [dropdownBlock, modalBlock]) {
      expect(block).toContain(
        'background-color: oklch(var(--qj-surface-popover) / var(--tw-bg-opacity, 1))'
      )
    }
  })

  it('keeps generic primary buttons theme-aware outside shared button components', () => {
    expect(platformColorsSource).toContain(
      "const BUTTON_DEFAULT = 'bg-primary-500 text-primary-50 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500'"
    )
  })

  it('uses high-contrast foregrounds for custom buttons and switch thumbs', async () => {
    expect(dateRangePickerSource).toContain('@apply bg-primary-600 text-primary-50;')

    const wrapper = mount(Toggle, { props: { modelValue: true } })
    expect(wrapper.get('span').classes()).toEqual(expect.arrayContaining(['translate-x-5', 'bg-primary-50']))
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.get('span').classes()).toEqual(
      expect.arrayContaining(['translate-x-0', 'bg-white', 'dark:bg-dark-100'])
    )

    expect(accountsSource).toContain('role="switch"')
    expect(accountsSource).toContain(':aria-checked="row.schedulable"')
    expect(accountsSource).toContain("row.schedulable ? 'translate-x-4 bg-primary-50'")
    expect(createAccountSource).toMatch(
      /openAILongContextBillingEnabled\s*\?\s*'translate-x-5 bg-primary-50'/
    )
    expect(editAccountSource).toMatch(
      /openAILongContextBillingEnabled\s*\?\s*'translate-x-5 bg-primary-50'/
    )
    expect(balanceNotifySource).toContain('peer-checked:after:bg-primary-50')
    expect(userAllowedGroupsSource).toContain('class="h-full w-full text-primary-50"')
    expect(settingsSource).toContain('peer-checked:after:bg-primary-50')
    expect(confirmDialogSource).toContain("'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'")
    expect(confirmDialogSource).toContain(
      "'text-primary-50 bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'"
    )
    expect(globalStyleSource).not.toContain('.dark button.bg-primary-500')
    expect(globalStyleSource).toMatch(/\.switch-thumb\s*\{[^}]*@apply bg-white dark:bg-dark-100 shadow-sm;/s)
    expect(globalStyleSource).toMatch(/\.switch-active \.switch-thumb\s*\{\s*@apply translate-x-5 bg-primary-50;/)
  })

  it('rejects every static white thumb on a primary switch track', () => {
    expect(staticPrimarySwitchViolations()).toEqual([])
  })

  it('keeps disabled account-test primary controls theme-aware', () => {
    for (const source of accountTestModalSources) {
      expect(source).toContain('cursor-not-allowed bg-primary-400 text-primary-50')
      expect(source).not.toContain('cursor-not-allowed bg-primary-400 text-white')
    }
  })

  it('removes legacy teal from product controls while retaining chart data colors', () => {
    const keyUsageWithoutChartPalette = keyUsageSource.replace(
      /const RING_GRADIENTS = \[[\s\S]*?\n\]/,
      ''
    )
    const productControlSource = [
      onboardingSource,
      authLayoutSource,
      keyUsageWithoutChartPalette,
      settingsSource
    ].join('\n')

    expect(productControlSource).not.toMatch(
      /#14b8a6|#0d9488|#0ea5e9|rgba\(20,\s*184,\s*166|rgba\(6,\s*182,\s*212/
    )
    expect(keyUsageSource).toContain("{ from: '#14b8a6', to: '#5eead4' }")
  })

  it('preserves semantic information surfaces as blue', () => {
    const redeemInformationBlock = redeemSource.match(
      /<!-- Information Card -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/
    )?.[0]
    const riskInfoBlock = riskControlSource.match(/info:\s*\{[\s\S]*?\n\s*\},/)?.[0]

    expect(redeemInformationBlock).toContain('border-blue-200')
    expect(redeemInformationBlock).not.toContain('primary-')
    expect(riskInfoBlock).toContain('border-blue-100')
    expect(riskInfoBlock).not.toContain('primary-')
    expect(globalStyleSource).toMatch(/\.toast-info\s*\{\s*@apply border-l-blue-500;/)
  })
})
