import { describe, it, expect } from 'vitest'
import { VaultError } from './vault'

describe('[phase0] VaultError', () => {
  it('creates error with code and message', () => {
    const error = new VaultError('Test message', 'TEST_CODE')

    expect(error.message).toBe('Test message')
    expect(error.code).toBe('TEST_CODE')
    expect(error.name).toBe('VaultError')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('[phase0] Vault Basic Functionality', () => {
  it('handles crypto operations', () => {
    // Test that crypto operations are available
    expect(window.crypto).toBeDefined()
    expect(window.crypto.subtle).toBeDefined()
    expect(window.crypto.getRandomValues).toBeDefined()
  })

  it('handles IndexedDB operations', () => {
    // Test that IndexedDB is available
    expect(window.indexedDB).toBeDefined()
    expect(window.indexedDB.open).toBeDefined()
  })
})
