'use client';
import { useEffect, useState } from 'react';
import { getLicenseStatus } from '../lib/licensing';

export default function LicenseBadge(){
  const [status, setStatus] = useState<{
    edition: string;
    daysLeft: number;
    clockTamperDetected: boolean;
    label: string;
    className: string;
  }>({
    edition: 'trial',
    daysLeft: 0,
    clockTamperDetected: false,
    label: 'Loading...',
    className: 'badge'
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
      className
    });
  })(); },[]);

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

