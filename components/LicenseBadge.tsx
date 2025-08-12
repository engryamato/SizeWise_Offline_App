'use client';
import { useEffect, useState } from 'react';
import { getLicenseStatus } from '../lib/licensing';
import { LoadingSpinner } from './LoadingSpinner';

export default function LicenseBadge(){
  const [status, setStatus] = useState<{
    edition: string;
    daysLeft: number;
    clockTamperDetected: boolean;
    label: string;
    className: string;
    isLoading: boolean;
  }>({
    edition: 'trial',
    daysLeft: 0,
    clockTamperDetected: false,
    label: '',
    className: 'badge',
    isLoading: true
  });

  useEffect(()=>{ (async()=>{
    const licenseStatus = await getLicenseStatus();
    let label = '';
    let className = 'badge';

    if (licenseStatus.clockTamperDetected) {
      label = 'Free Tier (Clock Tamper Detected)';
      className = 'badge badge-warning';
    } else if (licenseStatus.edition === 'trial') {
      if (licenseStatus.daysLeft <= 0) {
        label = 'Trial Expired';
        className = 'badge badge-expired';
      } else if (licenseStatus.daysLeft <= 3) {
        label = `Trial: ${licenseStatus.daysLeft} days left`;
        className = 'badge badge-warning';
      } else {
        label = `Trial: ${licenseStatus.daysLeft} days left`;
        className = 'badge badge-trial';
      }
    } else if (licenseStatus.edition === 'free') {
      label = 'Free Tier';
      className = 'badge badge-free';
    } else {
      label = 'Licensed';
      className = 'badge badge-licensed';
    }

    setStatus({
      ...licenseStatus,
      label,
      className,
      isLoading: false
    });
  })(); },[]);

  if (status.isLoading) {
    return (
      <div className="badge">
        <LoadingSpinner size="small" darkMode={false} />
      </div>
    );
  }

  return (
    <div
      className={status.className}
      role="status"
      aria-live="polite"
      title={status.clockTamperDetected ? 'Clock tampering detected - switched to free tier for security' : undefined}
    >
      {status.label}
    </div>
  );
}

