import { describe, it, expect } from 'vitest'
import { Auth } from './AuthService'

// Smoke tests placeholder for gate:auth

describe('[phaseAuth] AuthService PIN + Session', () => {
  it('exposes required API methods', () => {
    expect(typeof Auth.ensureLocalAccount).toBe('function')
    expect(typeof Auth.setPin).toBe('function')
    expect(typeof Auth.verifyPin).toBe('function')
    expect(typeof Auth.currentSession).toBe('function')
    expect(typeof Auth.lock).toBe('function')
    expect(typeof Auth.unlockWithSession).toBe('function')
  })
})

