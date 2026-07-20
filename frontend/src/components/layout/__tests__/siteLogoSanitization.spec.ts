import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const sidebarSource = readFileSync(resolve(dir, '../AppSidebar.vue'), 'utf8')
const homeViewSource = readFileSync(resolve(dir, '../../../views/HomeView.vue'), 'utf8')
const homeHeaderSource = readFileSync(resolve(dir, '../../home/HomeHeader.vue'), 'utf8')
const keyUsageViewSource = readFileSync(resolve(dir, '../../../views/KeyUsageView.vue'), 'utf8')

describe('site_logo sanitization', () => {
  it('AppSidebar imports sanitizeUrl and applies it to siteLogo', () => {
    expect(sidebarSource).toContain("import { sanitizeUrl } from '@/utils/url'")
    expect(sidebarSource).toContain('sanitizeUrl(appStore.siteLogo')
  })

  it('HomeView delegates the fixed QuotaJet logo to HomeHeader', () => {
    expect(homeViewSource).toContain('<HomeHeader')
    expect(homeViewSource).not.toContain('siteLogo')
    expect(homeHeaderSource).toContain('src="/logo.png"')
  })

  it('KeyUsageView applies sanitizeUrl to siteLogo', () => {
    expect(keyUsageViewSource).toContain('sanitizeUrl(cachedSiteLogo || storeSiteLogo || \'/logo.png\'')
  })

  it('dynamic site logo consumers pass allowRelative and allowDataUrl options', () => {
    for (const src of [sidebarSource, keyUsageViewSource]) {
      expect(src).toContain('allowRelative: true')
      expect(src).toContain('allowDataUrl: true')
    }
  })
})
