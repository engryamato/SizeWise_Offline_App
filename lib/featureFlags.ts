'use client';
export function flag(name: string, def = false){
  try {
    const v = sessionStorage.getItem(`ff_${name}`);
    return v ? v === '1' : def;
  } catch { return def; }
}
export function setFlag(name: string, on: boolean){
  try { sessionStorage.setItem(`ff_${name}`, on ? '1' : '0'); } catch {}
}

// Phase 1 feature flags
export const FEATURE_FLAGS = {
  VAULT_ENCRYPTION: 'enable-vault-encryption',
  FREE_TIER_GUARD: 'enable-free-tier-guard',
  PROJECT_AUTO_BACKUP: 'enable-project-auto-backup',
  AUTH_GATE_VAULT: 'auth-gate-vault',
  AUTH_WEBAUTHN: 'auth-webauthn',
} as const;

// Helper functions for specific flags
export function isVaultEncryptionEnabled(): boolean {
  return flag(FEATURE_FLAGS.VAULT_ENCRYPTION, true); // Default enabled for security
}

export function isFreeTierGuardEnabled(): boolean {
  return flag(FEATURE_FLAGS.FREE_TIER_GUARD, true); // Default enabled
}

export function isProjectAutoBackupEnabled(): boolean {
  return flag(FEATURE_FLAGS.PROJECT_AUTO_BACKUP, true); // Default enabled
}

export function isAuthGateVaultEnabled(): boolean {
  return flag(FEATURE_FLAGS.AUTH_GATE_VAULT, false); // Default off until auth rolls out
}

export function isAuthWebAuthnEnabled(): boolean {
  return flag(FEATURE_FLAGS.AUTH_WEBAUTHN, false); // Default behind flag
}

// Initialize default flags on first load
export function initializeDefaultFlags() {
  try {
    // Set defaults if not already set
    if (sessionStorage.getItem(`ff_${FEATURE_FLAGS.VAULT_ENCRYPTION}`) === null) {
      setFlag(FEATURE_FLAGS.VAULT_ENCRYPTION, true);
    }
    if (sessionStorage.getItem(`ff_${FEATURE_FLAGS.FREE_TIER_GUARD}`) === null) {
      setFlag(FEATURE_FLAGS.FREE_TIER_GUARD, true);
    }
    if (sessionStorage.getItem(`ff_${FEATURE_FLAGS.PROJECT_AUTO_BACKUP}`) === null) {
      setFlag(FEATURE_FLAGS.PROJECT_AUTO_BACKUP, true);
    }
  } catch {
    // Ignore errors in environments without sessionStorage
  }
}

