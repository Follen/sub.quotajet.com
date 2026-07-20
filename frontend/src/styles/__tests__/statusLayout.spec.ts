import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const statusStyles = readFileSync(resolve(dir, '../status.css'), 'utf8')

describe('public status layout', () => {
  it('uses in-flow AppHeader spacing on desktop and mobile', () => {
    expect(statusStyles).toContain('padding: 4rem 1.5rem 4rem;')
    expect(statusStyles).toContain('padding: 2rem 1rem 3rem;')
  })
})
