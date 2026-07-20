import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const statusStyles = readFileSync(resolve(dir, '../status.css'), 'utf8')

describe('public status layout', () => {
  it('matches the QuotaJet status shell on desktop and mobile', () => {
    expect(statusStyles).toContain('padding: 134px 24px 74px;')
    expect(statusStyles).toContain('min-height: 360px;')
    expect(statusStyles).toContain('border-radius: 28px;')
    expect(statusStyles).toContain('grid-template-columns: repeat(60, minmax(0, 1fr));')
    expect(statusStyles).toContain('padding: 92px 16px 54px;')
  })
})
