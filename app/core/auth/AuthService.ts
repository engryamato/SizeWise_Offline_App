import { openDb } from '../../../db/openDb'
import { migrate } from '../../../db/migrations'
import { ulid } from '../../../lib/ids'
import { validatePin, validateUlid, RateLimiter } from '../../../lib/inputValidation'
import { SESSION_CONFIG, RATE_LIMIT_CONFIG, generateSecureToken, logSecurityEvent } from '../../../lib/security'

export type Session = { id: string; accountId: string; createdAt: number; expiresAt: number }

// In-memory session and vault key gate
let currentSession: Session | null = null
const pinRateLimiter = new RateLimiter(RATE_LIMIT_CONFIG.PIN_ATTEMPTS.MAX_ATTEMPTS, RATE_LIMIT_CONFIG.PIN_ATTEMPTS.WINDOW_MS)

// PBKDF2 params (can be migrated later to Argon2id behind flag)
const PBKDF2_PARAMS = {
  iterations: 200_000,
  hash: 'SHA-256' as const,
  saltBytes: 16,
  keyLen: 32
}

async function hkdf(bytes: ArrayBuffer): Promise<string> {
  // Return hex string for constant-time compare use
  const arr = new Uint8Array(bytes)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function derivePinHash(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_PARAMS.iterations, hash: PBKDF2_PARAMS.hash },
    keyMaterial,
    PBKDF2_PARAMS.keyLen * 8
  )
  return new Uint8Array(bits)
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export const Auth = {
  async ensureLocalAccount(): Promise<string> {
    await migrate()
    const db = await openDb() as any
    const existing = db.selectValue(`SELECT id FROM accounts LIMIT 1`)
    if (existing) return existing
    const id = ulid()
    const now = Date.now()
    db.exec(`INSERT INTO accounts(id,display_name,created_at) VALUES(?,?,?)`, [id, 'Local User', now])
    return id
  },

  async setPin(accountId: string, pin: string): Promise<void> {
    // Validate inputs
    const accountIdValidation = validateUlid(accountId);
    if (!accountIdValidation.isValid) {
      throw new Error(`Invalid account ID: ${accountIdValidation.error}`);
    }

    const pinValidation = validatePin(pin);
    if (!pinValidation.isValid) {
      throw new Error(pinValidation.error);
    }

    const db = await openDb() as any
    const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_PARAMS.saltBytes))
    const hash = await derivePinHash(pinValidation.sanitized!, salt)
    const now = Date.now()
    const params = JSON.stringify({ kdf: 'pbkdf2', iters: PBKDF2_PARAMS.iterations, hash: PBKDF2_PARAMS.hash, len: PBKDF2_PARAMS.keyLen })
    db.exec(`INSERT OR REPLACE INTO pins(account_id,salt,hash,params,updated_at) VALUES(?,?,?,?,?)`, [accountIdValidation.sanitized, salt, hash, params, now])
  },

  async verifyPin(accountId: string, pin: string): Promise<Session> {
    // Validate inputs
    const accountIdValidation = validateUlid(accountId);
    if (!accountIdValidation.isValid) {
      logSecurityEvent('INVALID_ACCOUNT_ID', { accountId, error: accountIdValidation.error });
      throw new Error(`Invalid account ID: ${accountIdValidation.error}`);
    }

    const pinValidation = validatePin(pin);
    if (!pinValidation.isValid) {
      logSecurityEvent('INVALID_PIN_FORMAT', { accountId: accountIdValidation.sanitized, error: pinValidation.error });
      throw new Error(pinValidation.error);
    }

    // Check rate limiting
    if (!pinRateLimiter.isAllowed(accountIdValidation.sanitized!)) {
      logSecurityEvent('RATE_LIMITED_PIN_ATTEMPT', { accountId: accountIdValidation.sanitized });
      throw new Error('Too many PIN attempts. Please try again later.');
    }

    const db = await openDb() as any
    const rows:any[] = []
    db.exec({
      sql: `SELECT salt, hash, params, failed_attempts, next_allowed_at FROM pins WHERE account_id = ?`,
      bind: [accountIdValidation.sanitized],
      rowMode: 'object',
      callback: (r:any) => rows.push(r)
    })
    if (!rows.length) throw new Error('PIN not set')
    const row = rows[0]
    const saltBuf: Uint8Array = row.salt instanceof Uint8Array ? row.salt : new Uint8Array(row.salt)
    const hashStored: Uint8Array = row.hash instanceof Uint8Array ? row.hash : new Uint8Array(row.hash)

    const now = Date.now()
    if (typeof row.next_allowed_at === 'number' && now < row.next_allowed_at) {
      const secs = Math.ceil((row.next_allowed_at - now) / 1000)
      throw new Error(`Locked. Try again in ${secs}s`)
    }

    const hashCandidate = await derivePinHash(pinValidation.sanitized!, saltBuf)
    if (!timingSafeEqual(hashStored, hashCandidate)) {
      const newFails = (row.failed_attempts ?? 0) + 1
      const until = newFails >= 5 ? now + RATE_LIMIT_CONFIG.PIN_ATTEMPTS.LOCKOUT_MS : null
      db.exec(`UPDATE pins SET failed_attempts=?, next_allowed_at=? WHERE account_id=?`, [newFails, until, accountIdValidation.sanitized])
      logSecurityEvent('FAILED_PIN_ATTEMPT', {
        accountId: accountIdValidation.sanitized,
        attemptCount: newFails,
        isLocked: newFails >= 5
      });
      throw new Error(newFails >= 5 ? 'Too many attempts. Try later.' : 'Incorrect PIN')
    }

    // success: reset counters and rate limiter
    db.exec(`UPDATE pins SET failed_attempts=0, next_allowed_at=NULL WHERE account_id=?`, [accountIdValidation.sanitized])
    pinRateLimiter.reset(accountIdValidation.sanitized!)

    // Create session with expiration
    const expiresAt = Date.now() + SESSION_CONFIG.TIMEOUT_MS
    const session: Session = {
      id: ulid(),
      accountId: accountIdValidation.sanitized!,
      createdAt: Date.now(),
      expiresAt
    }
    db.exec(`INSERT INTO sessions(id,account_id,created_at,expires_at) VALUES(?,?,?,?)`, [session.id, accountIdValidation.sanitized, session.createdAt, session.expiresAt])

    logSecurityEvent('SUCCESSFUL_PIN_LOGIN', { accountId: accountIdValidation.sanitized })
    currentSession = session
    return session
  },

  async registerWebAuthn(accountId: string): Promise<void> {
    const { registerWebAuthnCredential } = await import('./WebAuthnService');
    await registerWebAuthnCredential(accountId);
  },

  async authenticateWebAuthn(accountId: string): Promise<Session> {
    const { authenticateWebAuthn } = await import('./WebAuthnService');
    const isValid = await authenticateWebAuthn(accountId);

    if (!isValid) {
      throw new Error('WebAuthn authentication failed');
    }

    // Create session on successful authentication
    const session: Session = {
      id: ulid(),
      accountId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_CONFIG.TIMEOUT_MS
    };
    const db = await openDb() as any;
    db.exec(`INSERT INTO sessions(id,account_id,created_at) VALUES(?,?,?)`, [session.id, accountId, session.createdAt]);
    currentSession = session;
    return session;
  },

  currentSession(): Session | null {
    // Check if current session is expired
    if (currentSession && Date.now() > currentSession.expiresAt) {
      logSecurityEvent('SESSION_EXPIRED', { sessionId: currentSession.id, accountId: currentSession.accountId });
      this.lock();
      return null;
    }
    return currentSession
  },

  // Validate session and extend expiration if valid
  async validateAndRefreshSession(sessionId: string): Promise<Session | null> {
    const sessionIdValidation = validateUlid(sessionId);
    if (!sessionIdValidation.isValid) {
      return null;
    }

    const db = await openDb() as any;
    const rows: any[] = [];
    db.exec({
      sql: `SELECT id, account_id, created_at, expires_at FROM sessions WHERE id = ?`,
      bind: [sessionIdValidation.sanitized],
      rowMode: 'object',
      callback: (r: any) => rows.push(r)
    });

    if (!rows.length) return null;

    const row = rows[0];
    const now = Date.now();

    // Check if session is expired
    if (row.expires_at && now > row.expires_at) {
      // Clean up expired session
      db.exec(`DELETE FROM sessions WHERE id = ?`, [sessionIdValidation.sanitized]);
      logSecurityEvent('EXPIRED_SESSION_CLEANUP', { sessionId: sessionIdValidation.sanitized });
      return null;
    }

    // Extend session expiration
    const newExpiresAt = now + SESSION_CONFIG.TIMEOUT_MS;
    db.exec(`UPDATE sessions SET expires_at = ? WHERE id = ?`, [newExpiresAt, sessionIdValidation.sanitized]);

    const session: Session = {
      id: row.id,
      accountId: row.account_id,
      createdAt: row.created_at,
      expiresAt: newExpiresAt
    };

    currentSession = session;
    return session;
  },

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    const db = await openDb() as any;
    const now = Date.now();

    // Get count of expired sessions for logging
    const expiredRows: any[] = [];
    db.exec({
      sql: `SELECT COUNT(*) as count FROM sessions WHERE expires_at < ?`,
      bind: [now],
      rowMode: 'object',
      callback: (r: any) => expiredRows.push(r)
    });

    const expiredCount = expiredRows[0]?.count || 0;

    // Delete expired sessions
    db.exec(`DELETE FROM sessions WHERE expires_at < ?`, [now]);

    if (expiredCount > 0) {
      logSecurityEvent('BULK_SESSION_CLEANUP', { expiredCount });
    }
  },

  lock(): void {
    // Wipe in-memory session (and later, in-memory vault key)
    currentSession = null
  },

  async logout(): Promise<void> {
    // Clear current session from database if it exists
    if (currentSession) {
      try {
        const db = await openDb() as any;
        db.exec(`DELETE FROM sessions WHERE id = ?`, [currentSession.id]);
        logSecurityEvent('USER_LOGOUT', {
          sessionId: currentSession.id,
          accountId: currentSession.accountId
        });
      } catch (error) {
        console.error('Failed to clear session from database:', error);
      }
    }

    // Clear in-memory session
    this.lock();
  },

  async unlockWithSession(session: Session): Promise<void> {
    // Later: hydrate the in-memory vault key here based on session
    // For now, just set the session reference
    currentSession = session
  }
}

