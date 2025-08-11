import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  flag, 
  setFlag, 
  FEATURE_FLAGS,
  isVaultEncryptionEnabled,
  isFreeTierGuardEnabled,
  isProjectAutoBackupEnabled,
  initializeDefaultFlags
} from './featureFlags'

// Mock sessionStorage
const mockSessionStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockSessionStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => mockSessionStorage.store.set(key, value)),
  removeItem: vi.fn((key: string) => mockSessionStorage.store.delete(key)),
  clear: vi.fn(() => mockSessionStorage.store.clear())
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
})

describe('[phase0] Feature Flags', () => {
  beforeEach(() => {
    mockSessionStorage.store.clear()
    vi.clearAllMocks()
    // Reset the mock implementation to use the store
    mockSessionStorage.getItem.mockImplementation((key) => mockSessionStorage.store.get(key) || null)
    mockSessionStorage.setItem.mockImplementation((key, value) => mockSessionStorage.store.set(key, value))
  })

  describe('flag and setFlag', () => {
    it('returns default value when flag not set', () => {
      expect(flag('test-flag')).toBe(false)
      expect(flag('test-flag', true)).toBe(true)
    })

    it('sets and retrieves flag values', () => {
      setFlag('test-flag', true)
      expect(flag('test-flag')).toBe(true)
      
      setFlag('test-flag', false)
      expect(flag('test-flag')).toBe(false)
    })

    it('handles sessionStorage errors gracefully', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('sessionStorage error')
      })
      
      expect(flag('test-flag')).toBe(false)
      expect(flag('test-flag', true)).toBe(true)
    })

    it('handles setFlag errors gracefully', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('sessionStorage error')
      })
      
      // Should not throw
      expect(() => setFlag('test-flag', true)).not.toThrow()
    })
  })

  describe('FEATURE_FLAGS constants', () => {
    it('defines correct flag names', () => {
      expect(FEATURE_FLAGS.VAULT_ENCRYPTION).toBe('enable-vault-encryption')
      expect(FEATURE_FLAGS.FREE_TIER_GUARD).toBe('enable-free-tier-guard')
      expect(FEATURE_FLAGS.PROJECT_AUTO_BACKUP).toBe('enable-project-auto-backup')
    })
  })

  describe('helper functions', () => {
    it('isVaultEncryptionEnabled returns correct values', () => {
      // Default should be true
      expect(isVaultEncryptionEnabled()).toBe(true)
      
      setFlag(FEATURE_FLAGS.VAULT_ENCRYPTION, false)
      expect(isVaultEncryptionEnabled()).toBe(false)
      
      setFlag(FEATURE_FLAGS.VAULT_ENCRYPTION, true)
      expect(isVaultEncryptionEnabled()).toBe(true)
    })

    it('isFreeTierGuardEnabled returns correct values', () => {
      // Default should be true
      expect(isFreeTierGuardEnabled()).toBe(true)
      
      setFlag(FEATURE_FLAGS.FREE_TIER_GUARD, false)
      expect(isFreeTierGuardEnabled()).toBe(false)
      
      setFlag(FEATURE_FLAGS.FREE_TIER_GUARD, true)
      expect(isFreeTierGuardEnabled()).toBe(true)
    })

    it('isProjectAutoBackupEnabled returns correct values', () => {
      // Default should be true
      expect(isProjectAutoBackupEnabled()).toBe(true)
      
      setFlag(FEATURE_FLAGS.PROJECT_AUTO_BACKUP, false)
      expect(isProjectAutoBackupEnabled()).toBe(false)
      
      setFlag(FEATURE_FLAGS.PROJECT_AUTO_BACKUP, true)
      expect(isProjectAutoBackupEnabled()).toBe(true)
    })
  })

  describe('initializeDefaultFlags', () => {
    it('sets default flags when not already set', () => {
      initializeDefaultFlags()
      
      expect(flag(FEATURE_FLAGS.VAULT_ENCRYPTION)).toBe(true)
      expect(flag(FEATURE_FLAGS.FREE_TIER_GUARD)).toBe(true)
      expect(flag(FEATURE_FLAGS.PROJECT_AUTO_BACKUP)).toBe(true)
    })

    it('does not override existing flags', () => {
      // Set flags to false first
      setFlag(FEATURE_FLAGS.VAULT_ENCRYPTION, false)
      setFlag(FEATURE_FLAGS.FREE_TIER_GUARD, false)
      
      initializeDefaultFlags()
      
      // Should remain false (not overridden)
      expect(flag(FEATURE_FLAGS.VAULT_ENCRYPTION)).toBe(false)
      expect(flag(FEATURE_FLAGS.FREE_TIER_GUARD)).toBe(false)
      // This one wasn't set, so should be initialized to true
      expect(flag(FEATURE_FLAGS.PROJECT_AUTO_BACKUP)).toBe(true)
    })

    it('handles sessionStorage errors gracefully', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('sessionStorage error')
      })
      
      // Should not throw
      expect(() => initializeDefaultFlags()).not.toThrow()
    })
  })

  describe('flag value parsing', () => {
    it('correctly parses string values', () => {
      // Set values directly in the mock store
      mockSessionStorage.store.set('ff_test-flag', '1')
      // Mock getItem to return the value from store
      mockSessionStorage.getItem.mockImplementation((key) => mockSessionStorage.store.get(key) || null)

      expect(flag('test-flag')).toBe(true)

      mockSessionStorage.store.set('ff_test-flag', '0')
      expect(flag('test-flag')).toBe(false)

      mockSessionStorage.store.set('ff_test-flag', 'invalid')
      expect(flag('test-flag')).toBe(false)
    })
  })
})
