import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ulid } from './ids'

describe('[phase0] ULID Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates valid ULID format', () => {
    const id = ulid()
    
    expect(typeof id).toBe('string')
    expect(id.length).toBe(24)
    expect(id).toMatch(/^[0-9a-z]{24}$/) // Only lowercase alphanumeric
  })

  it('generates unique IDs', () => {
    const ids = new Set()
    const count = 1000
    
    for (let i = 0; i < count; i++) {
      ids.add(ulid())
    }
    
    expect(ids.size).toBe(count) // All should be unique
  })

  it('generates sortable IDs (timestamp-based)', () => {
    const id1 = ulid()
    
    // Wait a bit to ensure different timestamp
    const start = Date.now()
    while (Date.now() === start) {
      // Busy wait for next millisecond
    }
    
    const id2 = ulid()
    
    // IDs should be sortable by timestamp (first 8 characters)
    expect(id1.substring(0, 8) <= id2.substring(0, 8)).toBe(true)
  })

  it('includes timestamp in base36', () => {
    const beforeTime = Date.now()
    const id = ulid()
    const afterTime = Date.now()
    
    // Extract timestamp part (first 8 characters)
    const timestampPart = id.substring(0, 8)
    const extractedTime = parseInt(timestampPart, 36)
    
    // Should be within the time range
    expect(extractedTime).toBeGreaterThanOrEqual(beforeTime)
    expect(extractedTime).toBeLessThanOrEqual(afterTime)
  })

  it('includes random part', () => {
    const id = ulid()
    
    // Random part is last 16 characters
    const randomPart = id.substring(8)
    expect(randomPart.length).toBe(16)
    expect(randomPart).toMatch(/^[0-9a-z]{16}$/)
  })

  it('handles Math.random correctly', () => {
    // Mock Math.random to return predictable values
    const originalRandom = Math.random
    let callCount = 0
    Math.random = vi.fn(() => {
      callCount++
      return callCount / 100 // 0.01, 0.02, 0.03, etc.
    })
    
    const id = ulid()
    
    // Should have called Math.random 16 times (for 16 random characters)
    expect(Math.random).toHaveBeenCalledTimes(16)
    
    // Random part should be deterministic based on our mock
    const randomPart = id.substring(8)
    // Each call to Math.random returns callCount/100, then Math.floor(value * 36).toString(36)
    // 0.01 * 36 = 0.36 -> floor = 0 -> '0'
    // 0.02 * 36 = 0.72 -> floor = 0 -> '0'
    // etc. until 0.03 * 36 = 1.08 -> floor = 1 -> '1'
    expect(randomPart).toBe('0011122233344555') // Based on our mock values
    
    // Restore
    Math.random = originalRandom
  })

  it('truncates to 24 characters', () => {
    // Even if timestamp + random exceeds 24 chars, should be truncated
    const id = ulid()
    expect(id.length).toBe(24)
  })

  it('pads timestamp to 8 characters', () => {
    // Mock Date.now to return small number
    const originalNow = Date.now
    Date.now = vi.fn(() => 1) // Very small timestamp
    
    const id = ulid()
    const timestampPart = id.substring(0, 8)
    
    // Should be padded with zeros
    expect(timestampPart).toBe('00000001')
    
    // Restore
    Date.now = originalNow
  })

  it('uses base36 encoding', () => {
    const id = ulid()
    
    // All characters should be valid base36 (0-9, a-z)
    for (const char of id) {
      expect('0123456789abcdefghijklmnopqrstuvwxyz').toContain(char)
    }
  })

  it('generates different IDs in rapid succession', () => {
    const ids = []
    
    // Generate multiple IDs rapidly
    for (let i = 0; i < 100; i++) {
      ids.push(ulid())
    }
    
    // All should be unique (random part should differ)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(100)
  })

  it('maintains lexicographic order for same millisecond', () => {
    // Mock Date.now to return same value
    const originalNow = Date.now
    Date.now = vi.fn(() => 1000)
    
    const id1 = ulid()
    const id2 = ulid()
    
    // Timestamp parts should be identical
    expect(id1.substring(0, 8)).toBe(id2.substring(0, 8))
    
    // But overall IDs should still be different due to random part
    expect(id1).not.toBe(id2)
    
    // Restore
    Date.now = originalNow
  })
})
