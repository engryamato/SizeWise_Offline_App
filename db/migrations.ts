import { openDb } from './openDb';

export async function migrate(){
  const db = await openDb();
  db.exec(`CREATE TABLE IF NOT EXISTS migrations(id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);`);
  const apply = (id: string, action: string | ((db: any) => void)) => {
    const row = (db as any).selectValue?.(`SELECT id FROM migrations WHERE id = ?`, [id]);
    if (row) return;
    if (typeof action === 'string') {
      db.exec(action);
    } else {
      action(db);
    }
    db.exec(`INSERT INTO migrations(id, applied_at) VALUES (?, ?)`, [id, Date.now()]);
  };

  apply('001_core', `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit_system TEXT NOT NULL,
      rules_version TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS junctions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      z REAL NOT NULL,
      fixed_pressure_pa REAL,
      fixed_flow_m3s REAL,
      meta_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      junction_from TEXT NOT NULL,
      junction_to TEXT NOT NULL,
      A REAL NOT NULL,
      Dh REAL NOT NULL,
      L REAL NOT NULL,
      k REAL NOT NULL,
      K REAL DEFAULT 0,
      geom_json TEXT NOT NULL,
      meta_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS results (
      project_id TEXT NOT NULL,
      segment_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      computed_at INTEGER NOT NULL,
      Q REAL NOT NULL,
      V REAL NOT NULL,
      Re REAL NOT NULL,
      f REAL NOT NULL,
      dP REAL NOT NULL,
      PRIMARY KEY(project_id, segment_id, run_id)
    );
    CREATE TABLE IF NOT EXISTS results_latest (
      project_id TEXT NOT NULL,
      segment_id TEXT NOT NULL PRIMARY KEY,
      run_id TEXT NOT NULL,
      Q REAL NOT NULL,
      V REAL NOT NULL,
      Re REAL NOT NULL,
      f REAL NOT NULL,
      dP REAL NOT NULL
    );
  `);

  apply('002_rename_legacy_tables', `
    -- Rename old tables if they exist (for migration from nodes/edges)
    DROP TABLE IF EXISTS nodes;
    DROP TABLE IF EXISTS edges;
  `);

  apply('003_additional_tables', `
    CREATE TABLE IF NOT EXISTS junction_pressures_latest (
      project_id TEXT NOT NULL,
      junction_id TEXT NOT NULL PRIMARY KEY,
      run_id TEXT NOT NULL,
      pressure_pa REAL NOT NULL,
      computed_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_payloads (
      project_id TEXT PRIMARY KEY,
      encrypted_data BLOB NOT NULL,
      iv BLOB NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_heads (
      project_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'residential',
      description TEXT NOT NULL DEFAULT '',
      unit_system TEXT NOT NULL,
      rules_version TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS device_info (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 004_auth: accounts, credentials, pins, sessions
  apply('004_auth', `
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      cred_id TEXT NOT NULL UNIQUE,
      public_key_jwk TEXT NOT NULL,
      alg INTEGER NOT NULL,
      sign_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pins (
      account_id TEXT PRIMARY KEY,
      salt BLOB NOT NULL,
      hash BLOB NOT NULL,
      params TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      -- optional lockout fields; may be added by 005
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      next_allowed_at INTEGER,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
  `);

  // 005_auth_lockout: add lockout columns if missing
  apply('005_auth_lockout', (db: any) => {
    const cols: any[] = (db as any).selectObjects?.(`PRAGMA table_info(pins)`) || [];
    const names = new Set(cols.map((c:any)=>c.name));
    db.exec('BEGIN IMMEDIATE');
    try {
      if (!names.has('failed_attempts')) db.exec(`ALTER TABLE pins ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0`);
      if (!names.has('next_allowed_at')) db.exec(`ALTER TABLE pins ADD COLUMN next_allowed_at INTEGER`);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  });

  // License storage for offline premium activation
  apply('004_licenses', `
    CREATE TABLE IF NOT EXISTS licenses (
      license_key TEXT PRIMARY KEY,
      edition TEXT NOT NULL,
      issued_at INTEGER NOT NULL,
      expires_at INTEGER,
      features TEXT NOT NULL,
      device_limit INTEGER NOT NULL,
      activated_at INTEGER NOT NULL,
      device_fingerprint TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_licenses_edition ON licenses(edition);
    CREATE INDEX IF NOT EXISTS idx_licenses_activated_at ON licenses(activated_at);
  `);

  // WebAuthn credentials for enhanced offline authentication
  apply('005_webauthn', `
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key_jwk TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_webauthn_account_id ON webauthn_credentials(account_id);
    CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials(credential_id);
  `);
}

