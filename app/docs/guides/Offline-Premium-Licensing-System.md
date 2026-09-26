# Offline-First Premium Licensing System

## Overview

SizeWise implements a comprehensive offline-first premium licensing system that allows users to purchase, activate, and use premium features without requiring an ongoing internet connection.

## Architecture

### 1. Cryptographic License Key System

**License Key Format:**
```
SW-XXXX-XXXX-XXXX-XXXX-XXXX
```

**Key Structure (Base64 encoded JSON + Ed25519 signature):**
```json
{
  "version": 1,
  "edition": "licensed",
  "issued_at": 1691234567890,
  "expires_at": null, // null = perpetual
  "features": ["unlimited_projects", "unlimited_segments", "advanced_tools"],
  "device_limit": 3,
  "metadata": {
    "customer_id": "cust_xxx",
    "order_id": "order_xxx"
  }
}
```

### 2. Security Implementation

**Key Generation (Server-side):**
1. Create license data JSON
2. Sign with Ed25519 private key
3. Combine data + signature into license key
4. Format as user-friendly key (SW-XXXX-XXXX...)

**Key Validation (Client-side):**
1. Parse license key format
2. Extract data and signature
3. Verify signature using embedded public key
4. Check expiration and feature flags
5. Store validated license in encrypted SQLite

### 3. Database Schema

**Licenses Table:**
```sql
CREATE TABLE licenses (
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
```

**WebAuthn Credentials Table:**
```sql
CREATE TABLE webauthn_credentials (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key_jwk TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL
);
```

## Implementation Files

### Core Files
- `lib/licensing.ts` - License validation and management
- `core/auth/WebAuthnService.ts` - Offline WebAuthn implementation
- `db/migrations.ts` - Database schema updates

### UI Components
- `app/license/page.tsx` - License status and upgrade page
- `app/license/activate/page.tsx` - License activation interface
- `components/LicenseBadge.tsx` - License status indicator

### API Functions

**License Management:**
```typescript
// Validate license key offline
await validateLicenseKey(licenseKey: string): Promise<LicenseData>

// Activate license locally
await activateLicense(licenseKey: string): Promise<void>

// Get activated license
await getActivatedLicense(): Promise<ActivatedLicense | null>

// Check current edition
await getEdition(): Promise<'trial' | 'free' | 'licensed'>
```

**WebAuthn Authentication:**
```typescript
// Register WebAuthn credential
await registerWebAuthnCredential(accountId: string): Promise<WebAuthnCredential>

// Authenticate with WebAuthn
await authenticateWebAuthn(accountId: string): Promise<boolean>

// Check WebAuthn support
isWebAuthnSupported(): boolean
```

## Payment & Distribution Strategy

### Option A: Hybrid Online/Offline Sales (Recommended)
1. Customer visits website and pays online (Stripe/PayPal)
2. Receives license key via email
3. Enters key in app (works offline)
4. App validates and activates locally

### Option B: Reseller Network (Enterprise)
1. Partner with software resellers
2. Generate license key batches
3. Resellers sell without internet
4. Customers activate offline

### Option C: App Store Integration
1. Platform-specific in-app purchases
2. Platform handles payments
3. App unlocks via platform APIs

## Security Features

### License Protection
- Ed25519 cryptographic signatures
- Device fingerprinting for binding
- Clock tamper detection
- Offline signature verification

### Authentication Enhancement
- WebAuthn support (Face ID, Touch ID, Windows Hello)
- Local credential storage
- No server-side verification needed
- Enhanced security over PIN-only

## User Experience

### Trial to Premium Flow
1. User starts with 14-day trial
2. Trial expires → automatic downgrade to free tier
3. User purchases license online
4. Receives license key via email
5. Activates in app (offline capable)
6. Immediate access to premium features

### Free Tier Limitations
- Max 2 projects
- Max 150 segments per project
- Limited export capabilities

### Premium Features
- Unlimited projects
- Unlimited segments per project
- Advanced calculation tools
- Full export capabilities
- Priority support

## Implementation Status

### ✅ Completed
- License key validation infrastructure
- Activation UI and workflow
- Database schema and migrations
- WebAuthn offline authentication
- Premium status detection
- Trial/free tier enforcement

### 🔄 Next Steps (Future)
1. Implement Ed25519 signature verification (currently stubbed)
2. Create license generation service (server-side)
3. Build payment integration (Stripe/PayPal)
4. Add license transfer/deactivation system
5. Enterprise license management features

## Benefits

### For Users
- Works completely offline after activation
- Simple license key entry process
- Enhanced security with WebAuthn
- No ongoing internet dependency

### For Business
- Prevents easy piracy (cryptographic validation)
- Flexible licensing models (perpetual/subscription)
- Multiple sales channels (online/offline/reseller)
- Scales from individual to enterprise

### For Development
- Fits existing offline-first architecture
- No server infrastructure required for validation
- Secure without being overly complex
- Future-proof and extensible

## Notes

This system maintains SizeWise's core offline-first principle while providing a robust premium licensing solution. Users can purchase and activate licenses without any ongoing internet dependency, making it perfect for truly offline environments.

The cryptographic approach ensures security while the offline-first design ensures usability in any environment.
