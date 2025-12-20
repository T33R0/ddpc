import { describe, it, expect } from 'vitest'

describe('Sanity Check', () => {
  it('should pass this basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string concatenation', () => {
    expect('hello ' + 'world').toBe('hello world')
  })
})
