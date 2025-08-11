import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  bootstrapLicense, 
  getEdition, 
  getTrialInfo, 
  getLicenseStatus,
  FREE_LIMITS 
} from './licensing'

// Mock localStorage
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.store.get(key) || null),
  setItem: vi.fn((key: string, value: string) => mockLocalStorage.store.set(key, value)),
  removeItem: vi.fn((key: string) => mockLocalStorage.store.delete(key)),
  clear: vi.fn(() => mockLocalStorage.store.clear())
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('[phase0] Licensing System', () => {
  beforeEach(() => {
    mockLocalStorage.store.clear()
    vi.clearAllMocks()
  })

  describe('bootstrapLicense', () => {
    it('creates new trial license on first run', async () => {
      const result = await bootstrapLicense()
      
      expect(result.edition).toBe('trial')
      expect(result.install_at).toBeTypeOf('number')
      expect(result.trial_ends_at).toBeGreaterThan(result.install_at)
      expect(result.last_run_at).toBe(result.install_at)
      expect(result.clock_tamper_detected).toBe(false)
      
      // Should be 14 days trial
      const trialDuration = result.trial_ends_at - result.install_at
      expect(trialDuration).toBe(14 * 24 * 60 * 60 * 1000)
    })

    it('updates last_run_at on subsequent runs', async () => {
      // First run
      const first = await bootstrapLicense()
      
      // Wait a bit and run again
      await new Promise(resolve => setTimeout(resolve, 10))
      const second = await bootstrapLicense()
      
      expect(second.last_run_at).toBeGreaterThan(first.last_run_at)
      expect(second.edition).toBe('trial')
    })

    it('detects clock tampering and switches to free', async () => {
      // First run
      await bootstrapLicense()
      
      // Manually set last_run_at to future (simulating clock tampering)
      const currentState = JSON.parse(mockLocalStorage.getItem('sw_license')!)
      currentState.last_run_at = Date.now() + 25 * 60 * 60 * 1000 // 25 hours in future
      mockLocalStorage.setItem('sw_license', JSON.stringify(currentState))
      
      // Next run should detect tampering
      const result = await bootstrapLicense()
      
      expect(result.edition).toBe('free')
      expect(result.clock_tamper_detected).toBe(true)
    })

    it('expires trial after 14 days', async () => {
      // Create expired trial
      const now = Date.now()
      const expiredState = {
        edition: 'trial',
        install_at: now - 15 * 24 * 60 * 60 * 1000, // 15 days ago
        trial_ends_at: now - 24 * 60 * 60 * 1000, // 1 day ago
        last_run_at: now - 24 * 60 * 60 * 1000,
        clock_tamper_detected: false
      }
      mockLocalStorage.setItem('sw_license', JSON.stringify(expiredState))
      
      const result = await bootstrapLicense()
      
      expect(result.edition).toBe('free')
    })
  })

  describe('getEdition', () => {
    it('returns trial for new installation', async () => {
      await bootstrapLicense()
      const edition = await getEdition()
      expect(edition).toBe('trial')
    })

    it('returns free for expired trial', async () => {
      const now = Date.now()
      const expiredState = {
        edition: 'trial',
        install_at: now - 15 * 24 * 60 * 60 * 1000,
        trial_ends_at: now - 24 * 60 * 60 * 1000,
        last_run_at: now,
        clock_tamper_detected: false
      }
      mockLocalStorage.setItem('sw_license', JSON.stringify(expiredState))
      
      await bootstrapLicense() // This should expire the trial
      const edition = await getEdition()
      expect(edition).toBe('free')
    })
  })

  describe('getTrialInfo', () => {
    it('calculates days left correctly', async () => {
      await bootstrapLicense()
      const info = await getTrialInfo()
      
      expect(info.daysLeft).toBeGreaterThan(13)
      expect(info.daysLeft).toBeLessThanOrEqual(14)
      expect(info.clockTamperDetected).toBe(false)
    })

    it('returns 0 days for expired trial', async () => {
      const now = Date.now()
      const expiredState = {
        edition: 'trial',
        install_at: now - 15 * 24 * 60 * 60 * 1000,
        trial_ends_at: now - 24 * 60 * 60 * 1000,
        last_run_at: now,
        clock_tamper_detected: false
      }
      mockLocalStorage.setItem('sw_license', JSON.stringify(expiredState))
      
      const info = await getTrialInfo()
      expect(info.daysLeft).toBe(0)
    })

    it('reports clock tamper detection', async () => {
      const now = Date.now()
      const tamperedState = {
        edition: 'free',
        install_at: now - 24 * 60 * 60 * 1000,
        trial_ends_at: now + 13 * 24 * 60 * 60 * 1000,
        last_run_at: now,
        clock_tamper_detected: true
      }
      mockLocalStorage.setItem('sw_license', JSON.stringify(tamperedState))
      
      const info = await getTrialInfo()
      expect(info.clockTamperDetected).toBe(true)
    })
  })

  describe('getLicenseStatus', () => {
    it('returns complete license status', async () => {
      await bootstrapLicense()
      const status = await getLicenseStatus()
      
      expect(status.edition).toBe('trial')
      expect(status.daysLeft).toBeGreaterThan(13)
      expect(status.clockTamperDetected).toBe(false)
      expect(status.installDate).toBeInstanceOf(Date)
    })
  })

  describe('FREE_LIMITS', () => {
    it('defines correct free tier limits', () => {
      expect(FREE_LIMITS.maxProjects).toBe(2)
      expect(FREE_LIMITS.maxEdgesPerProject).toBe(150)
    })
  })

  describe('error handling', () => {
    it('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw errors
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw, should return default trial
      const result = await bootstrapLicense()
      expect(result.edition).toBe('trial')
    })

    it('handles corrupted localStorage data', async () => {
      mockLocalStorage.setItem('sw_license', 'invalid json')
      
      // Should create new trial license
      const result = await bootstrapLicense()
      expect(result.edition).toBe('trial')
    })
  })
})
