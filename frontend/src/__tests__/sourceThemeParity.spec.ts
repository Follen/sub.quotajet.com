import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'
import tailwindConfig from '../../tailwind.config.js'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const globalStyleSource = readFileSync(resolve(frontendRoot, 'src/style.css'), 'utf8')
const onboardingSource = readFileSync(resolve(frontendRoot, 'src/styles/onboarding.css'), 'utf8')
const colors = tailwindConfig.theme.extend.colors
const primaryScale = colors.primary
const darkScale = colors.dark

describe('source-aligned global theme', () => {
  it('uses the QuotaJet neutral dark surface scale', () => {
    expect(darkScale).toEqual({
      50: 'oklch(0.985 0 0 / <alpha-value>)',
      100: 'oklch(0.965 0 0 / <alpha-value>)',
      200: 'oklch(0.9 0 0 / <alpha-value>)',
      300: 'oklch(0.78 0 0 / <alpha-value>)',
      400: 'oklch(0.68 0 0 / <alpha-value>)',
      500: 'oklch(0.44 0 0 / <alpha-value>)',
      600: 'oklch(0.335 0 0 / <alpha-value>)',
      700: 'oklch(0.305 0 0 / <alpha-value>)',
      800: 'oklch(0.285 0 0 / <alpha-value>)',
      900: 'oklch(0.235 0 0 / <alpha-value>)',
      950: 'oklch(0.225 0 0 / <alpha-value>)'
    })
  })

  it('backs primary utilities with theme-aware OKLCH variables', () => {
    expect(primaryScale[500]).toBe('oklch(var(--qj-primary-500) / <alpha-value>)')
    expect(globalStyleSource).toContain('--qj-primary-500: 0.13 0 0;')
    expect(globalStyleSource).toContain('--qj-primary-500: 0.965 0 0;')
  })

  it('uses a flat monochrome shared primary button', () => {
    const buttonBlock = globalStyleSource.match(/\.btn-primary\s*\{[\s\S]*?\n {2}\}/)?.[0]
    expect(buttonBlock).toContain('@apply bg-primary-500 text-primary-50;')
    expect(buttonBlock).toContain('@apply hover:bg-primary-600;')
    expect(buttonBlock).not.toContain('bg-gradient-to-r')
    expect(buttonBlock).not.toContain('shadow-primary')
  })

  it('applies the dark text override to any shared primary text-white element', () => {
    expect(globalStyleSource).toMatch(
      /\.dark\s+:is\(\.bg-primary-500\.text-white,\s*\.bg-primary-600\.text-white,\s*\.bg-primary-700\.text-white\)\s*\{\s*color:\s*oklch\(0\.155 0 0\);/m
    )
    expect(globalStyleSource).not.toContain(":is(button, a, [role='button']).bg-primary-500.text-white")
  })

  it('removes verified hard-coded blue-gray dark surfaces', () => {
    expect(colors.accent[800]).toBe('oklch(0.285 0 0)')
    expect(colors.accent[900]).toBe('oklch(0.235 0 0)')
    expect(colors.accent[950]).toBe('oklch(0.225 0 0)')
    expect(onboardingSource).not.toContain('#0f172a')
    expect(onboardingSource).not.toContain('#1e293b')
  })
})
