import { describe, expect, it } from 'vitest'
import router from '../index'

describe('public status route', () => {
  it('registers /status as an unauthenticated route', () => {
    const route = router.resolve('/status')

    expect(route.name).toBe('PublicStatus')
    expect(route.meta.requiresAuth).toBe(false)
  })
})
