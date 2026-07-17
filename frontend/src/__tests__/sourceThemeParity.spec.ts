import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tailwindSource = readFileSync(resolve(frontendRoot, 'tailwind.config.js'), 'utf8')
const globalStyleSource = readFileSync(resolve(frontendRoot, 'src/style.css'), 'utf8')
const onboardingSource = readFileSync(resolve(frontendRoot, 'src/styles/onboarding.css'), 'utf8')

describe('source-aligned global theme', () => {
  it('uses the QuotaJet neutral dark surface scale', () => {
    expect(tailwindSource).toContain("950: 'oklch(0.225 0 0)'")
    expect(tailwindSource).toContain("900: 'oklch(0.235 0 0)'")
    expect(tailwindSource).toContain("800: 'oklch(0.285 0 0)'")
    expect(tailwindSource).toContain("700: 'oklch(0.305 0 0)'")
    expect(tailwindSource).not.toContain("900: '#0f172a'")
    expect(tailwindSource).not.toContain("800: '#1e293b'")
    expect(tailwindSource).not.toContain("950: '#020617'")
  })

  it('backs primary utilities with theme-aware OKLCH variables', () => {
    expect(tailwindSource).toContain("500: 'oklch(var(--qj-primary-500) / <alpha-value>)'")
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

  it('removes verified hard-coded blue-gray dark surfaces', () => {
    expect(tailwindSource).not.toContain('linear-gradient(135deg, #1e293b 0%, #0f172a 100%)')
    expect(onboardingSource).not.toContain('#0f172a')
    expect(onboardingSource).not.toContain('#1e293b')
  })
})
