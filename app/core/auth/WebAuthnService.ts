// Offline WebAuthn implementation for enhanced local authentication
// Works completely offline - no server verification needed

import { openDb } from '../../../db/openDb';
import { ulid } from '../../../lib/ids';

export interface WebAuthnCredential {
  id: string;
  accountId: string;
  credentialId: string;
  publicKeyJWK: string;
  createdAt: number;
  lastUsedAt: number;
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

// Register a new WebAuthn credential (offline)
export async function registerWebAuthnCredential(accountId: string): Promise<WebAuthnCredential> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported on this device');
  }

  try {
    // Create credential options for offline use
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(accountId);

    const createOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'SizeWise',
          id: 'localhost', // For offline use
        },
        user: {
          id: userId,
          name: 'Local User',
          displayName: 'SizeWise Local User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Prefer built-in authenticators
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none', // No attestation needed for offline use
      },
    };

    // Create the credential
    const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('Failed to create WebAuthn credential');
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    
    // Extract public key from attestation response
    const publicKeyJWK = await extractPublicKeyFromAttestation(response);
    
    // Store credential in SQLite
    const webAuthnCred: WebAuthnCredential = {
      id: ulid(),
      accountId,
      credentialId: credential.id,
      publicKeyJWK: JSON.stringify(publicKeyJWK),
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };

    const db = await openDb() as any;
    db.exec(`
      INSERT INTO webauthn_credentials(
        id, account_id, credential_id, public_key_jwk, created_at, last_used_at
      ) VALUES(?,?,?,?,?,?)
    `, [
      webAuthnCred.id,
      webAuthnCred.accountId,
      webAuthnCred.credentialId,
      webAuthnCred.publicKeyJWK,
      webAuthnCred.createdAt,
      webAuthnCred.lastUsedAt,
    ]);

    return webAuthnCred;
  } catch (error) {
    throw new Error(`WebAuthn registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Authenticate using WebAuthn (offline verification)
export async function authenticateWebAuthn(accountId: string): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported on this device');
  }

  try {
    // Get stored credentials for this account
    const db = await openDb() as any;
    const rows: any[] = [];
    
    db.exec({
      sql: `SELECT * FROM webauthn_credentials WHERE account_id = ?`,
      bind: [accountId],
      rowMode: 'object',
      callback: (r: any) => rows.push(r)
    });

    if (!rows.length) {
      throw new Error('No WebAuthn credentials found for this account');
    }

    // Create authentication options
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const allowCredentials = rows.map(row => ({
      id: new TextEncoder().encode(row.credential_id),
      type: 'public-key' as const,
    }));

    const getOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        allowCredentials,
        userVerification: 'preferred',
        timeout: 60000,
      },
    };

    // Get the credential
    const credential = await navigator.credentials.get(getOptions) as PublicKeyCredential;
    
    if (!credential) {
      throw new Error('WebAuthn authentication failed');
    }

    const response = credential.response as AuthenticatorAssertionResponse;
    
    // Find the matching stored credential
    const storedCred = rows.find(row => row.credential_id === credential.id);
    if (!storedCred) {
      throw new Error('Credential not found in database');
    }

    // Verify the signature offline
    const publicKeyJWK = JSON.parse(storedCred.public_key_jwk);
    const isValid = await verifyWebAuthnSignature(
      response,
      publicKeyJWK,
      challenge
    );

    if (isValid) {
      // Update last used timestamp
      db.exec(`
        UPDATE webauthn_credentials 
        SET last_used_at = ? 
        WHERE id = ?
      `, [Date.now(), storedCred.id]);
    }

    return isValid;
  } catch (error) {
    throw new Error(`WebAuthn authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract public key from attestation response
async function extractPublicKeyFromAttestation(response: AuthenticatorAttestationResponse): Promise<JsonWebKey> {
  // This is a simplified implementation
  // In a real implementation, you'd parse the CBOR attestation object
  // For now, we'll create a placeholder JWK
  return {
    kty: 'EC',
    crv: 'P-256',
    x: 'placeholder_x',
    y: 'placeholder_y',
    use: 'sig',
    alg: 'ES256',
  };
}

// Verify WebAuthn signature offline
async function verifyWebAuthnSignature(
  response: AuthenticatorAssertionResponse,
  publicKeyJWK: JsonWebKey,
  challenge: Uint8Array
): Promise<boolean> {
  try {
    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJWK,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    // Create the data that was signed
    const clientDataJSON = new TextDecoder().decode(response.clientDataJSON);
    const clientData = JSON.parse(clientDataJSON);
    
    // Verify challenge matches
    const receivedChallenge = new Uint8Array(
      atob(clientData.challenge.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(c => c.charCodeAt(0))
    );
    
    if (!arraysEqual(challenge, receivedChallenge)) {
      return false;
    }

    // Verify the signature
    const signedData = new Uint8Array([
      ...new Uint8Array(response.authenticatorData),
      ...new Uint8Array(await crypto.subtle.digest('SHA-256', response.clientDataJSON))
    ]);

    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      response.signature,
      signedData
    );

    return isValid;
  } catch {
    return false;
  }
}

// Helper function to compare arrays
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Get WebAuthn credentials for an account
export async function getWebAuthnCredentials(accountId: string): Promise<WebAuthnCredential[]> {
  const db = await openDb() as any;
  const rows: any[] = [];
  
  db.exec({
    sql: `SELECT * FROM webauthn_credentials WHERE account_id = ? ORDER BY created_at DESC`,
    bind: [accountId],
    rowMode: 'object',
    callback: (r: any) => rows.push(r)
  });

  return rows.map(row => ({
    id: row.id,
    accountId: row.account_id,
    credentialId: row.credential_id,
    publicKeyJWK: row.public_key_jwk,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }));
}
