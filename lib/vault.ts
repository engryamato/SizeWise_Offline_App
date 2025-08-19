'use client';
import { isVaultEncryptionEnabled, isAuthGateVaultEnabled } from './featureFlags';
import { Auth } from '../app/core/auth/AuthService';
import { validateUlid, validateJsonData } from './inputValidation';
import { logSecurityEvent } from './security';

// Device-key vault for encrypted project snapshots
// Uses AES-GCM encryption with device-generated keys stored in IndexedDB

const VAULT_DB_NAME = 'sizewise_vault';
const VAULT_DB_VERSION = 1;
const KEY_STORE_NAME = 'device_keys';
const SNAPSHOT_STORE_NAME = 'encrypted_snapshots';

interface DeviceKey {
  id: string;
  key: CryptoKey;
  created_at: number;
}

interface EncryptedSnapshot {
  id: string;
  project_id: string;
  encrypted_data: ArrayBuffer;
  iv: ArrayBuffer;
  created_at: number;
  snapshot_type: 'create' | 'save' | 'close' | 'manual';
}

class VaultError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VaultError';
  }
}

// IndexedDB helper functions
function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);
    
    request.onerror = () => reject(new VaultError('Failed to open vault database', 'DB_OPEN_ERROR'));
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create key store
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        const keyStore = db.createObjectStore(KEY_STORE_NAME, { keyPath: 'id' });
        keyStore.createIndex('created_at', 'created_at');
      }
      
      // Create snapshot store
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE_NAME)) {
        const snapshotStore = db.createObjectStore(SNAPSHOT_STORE_NAME, { keyPath: 'id' });
        snapshotStore.createIndex('project_id', 'project_id');
        snapshotStore.createIndex('created_at', 'created_at');
        snapshotStore.createIndex('snapshot_type', 'snapshot_type');
      }
    };
  });
}

// Generate a new AES-GCM key
async function generateDeviceKey(): Promise<CryptoKey> {
  try {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // not extractable for security
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new VaultError('Failed to generate device key', 'KEY_GENERATION_ERROR');
  }
}

// Get or create the device key
async function getDeviceKey(): Promise<CryptoKey> {
  if (!isVaultEncryptionEnabled()) {
    throw new VaultError('Vault encryption is disabled', 'ENCRYPTION_DISABLED');
  }

  try {
    const db = await openVaultDB();
    const transaction = db.transaction([KEY_STORE_NAME], 'readonly');
    const store = transaction.objectStore(KEY_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('device_key');
      
      request.onsuccess = async () => {
        if (request.result) {
          resolve(request.result.key);
        } else {
          // Generate new key
          try {
            const newKey = await generateDeviceKey();
            await storeDeviceKey(newKey);
            resolve(newKey);
          } catch (error) {
            reject(error);
          }
        }
      };
      
      request.onerror = () => reject(new VaultError('Failed to retrieve device key', 'KEY_RETRIEVAL_ERROR'));
    });
  } catch (error) {
    throw new VaultError('Failed to access vault database', 'DB_ACCESS_ERROR');
  }
}

// Store the device key in IndexedDB
async function storeDeviceKey(key: CryptoKey): Promise<void> {
  const db = await openVaultDB();
  const transaction = db.transaction([KEY_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(KEY_STORE_NAME);
  
  const deviceKey: DeviceKey = {
    id: 'device_key',
    key,
    created_at: Date.now()
  };
  
  return new Promise((resolve, reject) => {
    const request = store.put(deviceKey);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new VaultError('Failed to store device key', 'KEY_STORAGE_ERROR'));
  });
}

// Encrypt data using AES-GCM
async function encryptData(data: string): Promise<{ encrypted: ArrayBuffer; iv: ArrayBuffer }> {
  // Optional auth gate: require unlocked session before allowing encryption
  if (isAuthGateVaultEnabled()) {
    const session = (await import('../app/core/auth/AuthService')).Auth.currentSession()
    if (!session) throw new VaultError('Vault is locked', 'VAULT_LOCKED')
  }
  const key = await getDeviceKey();
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  try {
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer
    );
    
    return { encrypted, iv: iv.buffer };
  } catch (error) {
    throw new VaultError('Failed to encrypt data', 'ENCRYPTION_ERROR');
  }
}

// Decrypt data using AES-GCM
async function decryptData(encrypted: ArrayBuffer, iv: ArrayBuffer): Promise<string> {
  // Optional auth gate: require unlocked session before allowing decryption
  if (isAuthGateVaultEnabled()) {
    const session = (await import('../app/core/auth/AuthService')).Auth.currentSession()
    if (!session) throw new VaultError('Vault is locked', 'VAULT_LOCKED')
  }
  const key = await getDeviceKey();
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new VaultError('Failed to decrypt data', 'DECRYPTION_ERROR');
  }
}

// Public API
export class DeviceVault {
  // Create an encrypted snapshot of project data
  static async createSnapshot(
    projectId: string,
    data: any,
    type: 'create' | 'save' | 'close' | 'manual' = 'manual'
  ): Promise<string> {
    if (!isVaultEncryptionEnabled()) {
      return ''; // Skip if encryption disabled
    }

    // Validate inputs
    const projectIdValidation = validateUlid(projectId);
    if (!projectIdValidation.isValid) {
      logSecurityEvent('VAULT_INVALID_PROJECT_ID', { projectId, error: projectIdValidation.error });
      throw new VaultError(`Invalid project ID: ${projectIdValidation.error}`, 'INVALID_PROJECT_ID');
    }

    const dataValidation = validateJsonData(data);
    if (!dataValidation.isValid) {
      logSecurityEvent('VAULT_INVALID_DATA', { projectId: projectIdValidation.sanitized, error: dataValidation.error });
      throw new VaultError(`Invalid data: ${dataValidation.error}`, 'INVALID_DATA');
    }

    try {
      const { encrypted, iv } = await encryptData(dataValidation.sanitized!);
      
      const snapshot: EncryptedSnapshot = {
        id: `${projectId}_${Date.now()}_${type}`,
        project_id: projectId,
        encrypted_data: encrypted,
        iv,
        created_at: Date.now(),
        snapshot_type: type
      };
      
      const db = await openVaultDB();
      const transaction = db.transaction([SNAPSHOT_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SNAPSHOT_STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.put(snapshot);
        request.onsuccess = () => resolve(snapshot.id);
        request.onerror = () => reject(new VaultError('Failed to store snapshot', 'SNAPSHOT_STORAGE_ERROR'));
      });
    } catch (error) {
      console.error('Vault snapshot creation failed:', error);
      return ''; // Fail silently to not break app functionality
    }
  }

  // Retrieve and decrypt a snapshot
  static async getSnapshot(snapshotId: string): Promise<any | null> {
    if (!isVaultEncryptionEnabled()) {
      return null;
    }

    // Validate snapshot ID format
    if (typeof snapshotId !== 'string' || !snapshotId.trim()) {
      logSecurityEvent('VAULT_INVALID_SNAPSHOT_ID', { snapshotId });
      throw new VaultError('Invalid snapshot ID', 'INVALID_SNAPSHOT_ID');
    }

    try {
      const db = await openVaultDB();
      const transaction = db.transaction([SNAPSHOT_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SNAPSHOT_STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.get(snapshotId);
        
        request.onsuccess = async () => {
          if (!request.result) {
            resolve(null);
            return;
          }
          
          try {
            const snapshot = request.result as EncryptedSnapshot;
            const decryptedData = await decryptData(snapshot.encrypted_data, snapshot.iv);
            resolve(JSON.parse(decryptedData));
          } catch (error) {
            reject(error);
          }
        };
        
        request.onerror = () => reject(new VaultError('Failed to retrieve snapshot', 'SNAPSHOT_RETRIEVAL_ERROR'));
      });
    } catch (error) {
      console.error('Vault snapshot retrieval failed:', error);
      return null;
    }
  }

  // List snapshots for a project
  static async listSnapshots(projectId: string): Promise<Array<{id: string; created_at: number; type: string}>> {
    if (!isVaultEncryptionEnabled()) {
      return [];
    }

    try {
      const db = await openVaultDB();
      const transaction = db.transaction([SNAPSHOT_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SNAPSHOT_STORE_NAME);
      const index = store.index('project_id');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(projectId);
        
        request.onsuccess = () => {
          const snapshots = request.result.map((snapshot: EncryptedSnapshot) => ({
            id: snapshot.id,
            created_at: snapshot.created_at,
            type: snapshot.snapshot_type
          }));
          
          // Sort by creation time, newest first
          snapshots.sort((a, b) => b.created_at - a.created_at);
          resolve(snapshots);
        };
        
        request.onerror = () => reject(new VaultError('Failed to list snapshots', 'SNAPSHOT_LIST_ERROR'));
      });
    } catch (error) {
      console.error('Vault snapshot listing failed:', error);
      return [];
    }
  }

  // Clean up old snapshots (keep only the latest N per project)
  static async cleanupSnapshots(projectId: string, keepCount: number = 5): Promise<void> {
    if (!isVaultEncryptionEnabled()) {
      return;
    }

    try {
      const snapshots = await this.listSnapshots(projectId);
      if (snapshots.length <= keepCount) {
        return; // Nothing to clean up
      }

      const toDelete = snapshots.slice(keepCount);
      const db = await openVaultDB();
      const transaction = db.transaction([SNAPSHOT_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SNAPSHOT_STORE_NAME);

      for (const snapshot of toDelete) {
        store.delete(snapshot.id);
      }
    } catch (error) {
      console.error('Vault cleanup failed:', error);
      // Fail silently
    }
  }
}

export { VaultError };
