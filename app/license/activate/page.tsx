'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PillNavigation from '../../../components/PillNavigation';
import styles from '../../../components/PillNavigation.module.css';
import { activateLicense, validateLicenseKey } from '../../../lib/licensing';

export default function ActivateLicensePage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const formatLicenseKey = (value: string) => {
    // Remove all non-alphanumeric characters
    const clean = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Add SW- prefix and format as SW-XXXX-XXXX-XXXX-XXXX-XXXX
    if (clean.length === 0) return '';
    
    let formatted = 'SW-';
    for (let i = 0; i < clean.length && i < 20; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += clean[i];
    }
    
    return formatted;
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value);
    setLicenseKey(formatted);
    setError(undefined);
  };

  const handleActivate = async () => {
    setError(undefined);
    setBusy(true);

    try {
      // Validate license key format
      if (!licenseKey.match(/^SW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
        throw new Error('Please enter a valid license key in format SW-XXXX-XXXX-XXXX-XXXX-XXXX');
      }

      // Validate and activate license
      await validateLicenseKey(licenseKey);
      await activateLicense(licenseKey);
      
      setSuccess(true);
      
      // Redirect to license page after success
      setTimeout(() => {
        router.push('/license');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to activate license');
    } finally {
      setBusy(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const formatted = formatLicenseKey(pasted);
    setLicenseKey(formatted);
    setError(undefined);
  };

  if (success) {
    return (
      <>
        <PillNavigation />
        <div className={`container ${styles.contentOffset}`}>
          <div className="panel text-center">
            <h1>✅ License Activated!</h1>
            <p>Your SizeWise license has been successfully activated.</p>
            <p className="muted">You now have access to all premium features.</p>
            <p className="muted">Redirecting to license page...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PillNavigation />
      <div className={`container ${styles.contentOffset}`}>
        <h1>Activate License</h1>
        
        <div className="panel">
          <h2>Enter License Key</h2>
          <p className="muted">
            Enter the license key you received after purchase to unlock premium features.
          </p>
          
          <div className="form-group">
            <label htmlFor="license-key">License Key</label>
            <input
              id="license-key"
              type="text"
              value={licenseKey}
              onChange={handleKeyChange}
              onPaste={handlePaste}
              placeholder="SW-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="form-control"
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '16px',
                letterSpacing: '1px',
                textAlign: 'center'
              }}
              disabled={busy}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button 
              onClick={handleActivate}
              disabled={busy || !licenseKey.match(/^SW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)}
              className="btn btn-primary"
            >
              {busy ? 'Activating...' : 'Activate License'}
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Don't have a license?</h2>
          <p>Purchase a SizeWise license to unlock:</p>
          <ul>
            <li>Unlimited projects</li>
            <li>Unlimited segments per project</li>
            <li>Advanced calculation tools</li>
            <li>Export capabilities</li>
            <li>Priority support</li>
          </ul>
          <p>
            <a href="https://sizewise.app/purchase" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Purchase License
            </a>
          </p>
          <p className="muted">
            License activation works completely offline - no internet connection required.
          </p>
        </div>
      </div>
    </>
  );
}
