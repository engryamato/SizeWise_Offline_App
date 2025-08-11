import { openDb } from '../../db/openDb'
import { migrate } from '../../db/migrations'
import { ulid } from '../../lib/ids'

export type Session = { id: string; accountId: string; createdAt: number; expiresAt?: number }

// In-memory session and vault key gate
let currentSession: Session | null = null

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
    { name: 'PBKDF2', salt, iterations: PBKDF2_PARAMS.iterations, hash: PBKDF2_PARAMS.hash },
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
    const db = await openDb() as any
    const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_PARAMS.saltBytes))
    const hash = await derivePinHash(pin, salt)
    const now = Date.now()
    const params = JSON.stringify({ kdf: 'pbkdf2', iters: PBKDF2_PARAMS.iterations, hash: PBKDF2_PARAMS.hash, len: PBKDF2_PARAMS.keyLen })
    db.exec(`INSERT OR REPLACE INTO pins(account_id,salt,hash,params,updated_at) VALUES(?,?,?,?,?)`, [accountId, salt, hash, params, now])
  },

  async verifyPin(accountId: string, pin: string): Promise<Session> {
    const db = await openDb() as any
    const rows:any[] = []
    db.exec({
      sql: `SELECT salt, hash, params, failed_attempts, next_allowed_at FROM pins WHERE account_id = ?`,
      bind: [accountId],
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

    const iterations = (() => { try { return JSON.parse(row.params).iterations ?? PBKDF2_PARAMS.iterations } catch { return PBKDF2_PARAMS.iterations } })()
    const hashCandidate = await derivePinHash(pin, saltBuf)
    if (!timingSafeEqual(hashStored, hashCandidate)) {
      const newFails = (row.failed_attempts ?? 0) + 1
      const until = newFails >= 5 ? now + 5 * 60_000 : null
      db.exec(`UPDATE pins SET failed_attempts=?, next_allowed_at=? WHERE account_id=?`, [newFails, until, accountId])
      throw new Error(newFails >= 5 ? 'Too many attempts. Try later.' : 'Incorrect PIN')
    }

    // success: reset counters
    db.exec(`UPDATE pins SET failed_attempts=0, next_allowed_at=NULL WHERE account_id=?`, [accountId])

    // Create session
    const session: Session = { id: ulid(), accountId, createdAt: Date.now() }
    db.exec(`INSERT INTO sessions(id,account_id,created_at) VALUES(?,?,?)`, [session.id, accountId, session.createdAt])
    currentSession = session
    return session
  },

  async registerWebAuthn(accountId: string): Promise<void> {
    // TODO: Implement WebAuthn registration with local ceremony
    // - Create options (publicKey)
    // - navigator.credentials.create
    // - Store publicKey JWK + credId in credentials
    throw new Error('WebAuthn registration not implemented yet')
  },

  async authenticateWebAuthn(accountId: string): Promise<Session> {
    // TODO: Implement WebAuthn authentication with local verification
    // - navigator.credentials.get
    // - Verify signature locally
    // - Create session
    throw new Error('WebAuthn authentication not implemented yet')
  },

  currentSession(): Session | null {
    return currentSession
  },

  lock(): void {
    // Wipe in-memory session (and later, in-memory vault key)
    currentSession = null
  },

  async unlockWithSession(session: Session): Promise<void> {
    // Later: hydrate the in-memory vault key here based on session
    // For now, just set the session reference
    currentSession = session
  }
}

