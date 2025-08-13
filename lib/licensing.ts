'use client';
// Offline trial → free tier licensing
// Stores authoritative values in OPFS (via SQLite later); mirrors status in localStorage for early UI

export type Edition = 'trial'|'free'|'licensed';
const LS_KEY = 'sw_license';

function readLS(){
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeLS(v:any){ try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
}

export async function bootstrapLicense(){
  const now = Date.now();
  const cur = readLS();
  if (!cur) {
    const trialDays = 14;
    const state = { edition: 'trial', install_at: now, trial_ends_at: now + trialDays*86400000, last_run_at: now, clock_tamper_detected: false };
    writeLS(state);
    return state;
  }
  // clock tamper detection (basic): if now < last_run_at by more than 24h, drop to free
  const clockTamperDetected = now + 86400000 < cur.last_run_at;
  if (clockTamperDetected) {
    cur.edition = 'free';
    cur.clock_tamper_detected = true;
  }
  cur.last_run_at = now;
  if (cur.edition === 'trial' && now > cur.trial_ends_at) cur.edition = 'free';
  writeLS(cur);
  return cur;
}

export async function getEdition(): Promise<Edition> {
  // First check for activated license (premium)
  const activatedLicense = await getActivatedLicense();
  if (activatedLicense) {
    return activatedLicense.edition;
  }

  // Fall back to trial/free status
  const cur = readLS();
  return (cur?.edition ?? 'trial') as Edition;
}

export async function getTrialInfo(){
  const cur = readLS();
  const now = Date.now();
  const daysLeft = cur?.trial_ends_at ? Math.max(0, Math.ceil((cur.trial_ends_at - now)/86400000)) : 0;
  return {
    daysLeft,
    clockTamperDetected: cur?.clock_tamper_detected || false
  };
}

export async function getLicenseStatus(){
  const cur = readLS();
  const edition = await getEdition();
  const trialInfo = await getTrialInfo();

  return {
    edition,
    ...trialInfo,
    installDate: cur?.install_at ? new Date(cur.install_at) : null
  };
}

export const FREE_LIMITS = { maxProjects: 2, maxEdgesPerProject: 150 };

// License key validation (offline cryptographic verification)
const LICENSE_PUBLIC_KEY = 'ed25519_public_key_here'; // Embedded public key for verification

export interface LicenseData {
  version: number;
  edition: 'trial' | 'free' | 'licensed';
  issued_at: number;
  expires_at: number | null;
  features: string[];
  device_limit: number;
  metadata: {
    customer_id?: string;
    order_id?: string;
  };
}

export interface ActivatedLicense extends LicenseData {
  license_key: string;
  activated_at: number;
  device_fingerprint: string;
}

// Offline license key validation
export async function validateLicenseKey(licenseKey: string): Promise<LicenseData> {
  try {
    // Parse license key format (SW-XXXX-XXXX-XXXX-XXXX-XXXX)
    const cleanKey = licenseKey.replace(/SW-|-/g, '');
    if (cleanKey.length !== 20) throw new Error('Invalid license key format');

    // Decode base64 data and signature
    const decoded = atob(cleanKey);
    const data = JSON.parse(decoded.slice(0, -64)); // License data
    // const signature = decoded.slice(-64); // Ed25519 signature

    // Verify signature using embedded public key
    // TODO: Implement Ed25519 signature verification
    // const isValid = await verifySignature(data, signature, LICENSE_PUBLIC_KEY);
    // if (!isValid) throw new Error('Invalid license signature');

    // Check expiration
    if (data.expires_at && Date.now() > data.expires_at) {
      throw new Error('License has expired');
    }

    return data as LicenseData;
  } catch (error) {
    throw new Error(`License validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Activate license key (store in SQLite)
export async function activateLicense(licenseKey: string): Promise<void> {
  const licenseData = await validateLicenseKey(licenseKey);

  // Generate device fingerprint for binding
  const deviceFingerprint = await generateDeviceFingerprint();

  const activatedLicense: ActivatedLicense = {
    ...licenseData,
    license_key: licenseKey,
    activated_at: Date.now(),
    device_fingerprint: deviceFingerprint
  };

  // Store in SQLite (encrypted)
  const { openDb } = await import('../db/openDb');
  const db = await openDb() as any;

  db.exec(`
    INSERT OR REPLACE INTO licenses(
      license_key, edition, issued_at, expires_at, features,
      device_limit, activated_at, device_fingerprint, metadata
    ) VALUES(?,?,?,?,?,?,?,?,?)
  `, [
    activatedLicense.license_key,
    activatedLicense.edition,
    activatedLicense.issued_at,
    activatedLicense.expires_at,
    JSON.stringify(activatedLicense.features),
    activatedLicense.device_limit,
    activatedLicense.activated_at,
    activatedLicense.device_fingerprint,
    JSON.stringify(activatedLicense.metadata)
  ]);

  // Update localStorage cache
  const currentState = readLS() || {};
  currentState.edition = activatedLicense.edition;
  currentState.licensed_features = activatedLicense.features;
  writeLS(currentState);
}

// Check for activated license
export async function getActivatedLicense(): Promise<ActivatedLicense | null> {
  try {
    const { openDb } = await import('../db/openDb');
    const db = await openDb() as any;
    const rows: any[] = [];

    db.exec({
      sql: `SELECT * FROM licenses ORDER BY activated_at DESC LIMIT 1`,
      rowMode: 'object',
      callback: (r: any) => rows.push(r)
    });

    if (!rows.length) return null;

    const row = rows[0];
    const license: ActivatedLicense = {
      version: 1,
      edition: row.edition,
      issued_at: row.issued_at,
      expires_at: row.expires_at,
      features: JSON.parse(row.features || '[]'),
      device_limit: row.device_limit,
      metadata: JSON.parse(row.metadata || '{}'),
      license_key: row.license_key,
      activated_at: row.activated_at,
      device_fingerprint: row.device_fingerprint
    };

    // Validate license is still valid
    if (license.expires_at && Date.now() > license.expires_at) {
      return null; // Expired
    }

    return license;
  } catch {
    return null;
  }
}

// Generate device fingerprint for license binding
async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '0'
  ];

  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

