// @vitest-environment node
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const readAssetHash = (name: string) => createHash('sha256')
  .update(readFileSync(resolve(frontendRoot, 'public', name)))
  .digest('hex')

describe('QuotaJet static brand', () => {
  it('ships the main-site Logo and favicon', () => {
    expect(readAssetHash('logo.png')).toBe('b4b0fa9bbc1bd2b074029d23db61a9b47fb0430626f24ab4f769af87bd04dc0c')
    expect(readAssetHash('favicon.ico')).toBe('30fa75cd91c3a073fa4aa765ce3d4b4183e4cd0388dd657506479150958a48c7')
  })

  it('advertises the future QuotaJet production identity', () => {
    const html = readFileSync(resolve(frontendRoot, 'index.html'), 'utf8')
    expect(html).toContain('<title>QuotaJet</title>')
    expect(html).toContain('content="https://quotajet.com/"')
    expect(html).toContain('content="https://quotajet.com/logo.png?v=quotajet-20260618"')
    expect(html).toContain('One private gateway for fast routes, fair pricing, and mainstream AI models.')
    expect(html).toContain('href="/favicon.ico?v=quotajet-20260618"')
  })
})
