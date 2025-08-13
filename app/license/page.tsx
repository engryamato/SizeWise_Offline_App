'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar';
import { bootstrapLicense, getEdition, getTrialInfo, FREE_LIMITS, getActivatedLicense } from '../../lib/licensing';

export default function LicensePage(){
  const router = useRouter();
  const [state, setState] = useState({
    edition: 'trial',
    daysLeft: 0,
    activatedLicense: null as any,
    loading: true
  });

  useEffect(()=>{ (async()=>{
    await bootstrapLicense();
    const ed = await getEdition();
    const t = await getTrialInfo();
    const license = await getActivatedLicense();
    setState({
      edition: ed,
      daysLeft: t.daysLeft,
      activatedLicense: license,
      loading: false
    });
  })(); },[]);

  if (state.loading) {
    return (
      <>
        <NavBar />
        <div className="container">
          <h1>License & Limits</h1>
          <div className="panel">
            <p>Loading license information...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="container">
        <h1>License & Limits</h1>

        <div className="panel">
          <h2>Current License</h2>
          <p>Edition: <strong className={`badge badge-${state.edition}`}>{state.edition}</strong></p>

          {state.edition === 'trial' && (
            <>
              <p>Trial days left: <strong>{state.daysLeft}</strong></p>
              {state.daysLeft <= 3 && (
                <div className="alert alert-warning">
                  Your trial is expiring soon! Activate a license to continue using premium features.
                </div>
              )}
            </>
          )}

          {state.edition === 'free' && (
            <>
              <h3>Free Tier Limits</h3>
              <ul>
                <li>Max projects: {FREE_LIMITS.maxProjects}</li>
                <li>Max segments per project: {FREE_LIMITS.maxEdgesPerProject}</li>
              </ul>
              <div className="alert alert-info">
                Upgrade to a licensed version to remove these limits and access premium features.
              </div>
            </>
          )}

          {state.edition === 'licensed' && state.activatedLicense && (
            <>
              <h3>Licensed Features</h3>
              <ul>
                {state.activatedLicense.features.map((feature: string) => (
                  <li key={feature}>✅ {feature.replace(/_/g, ' ')}</li>
                ))}
              </ul>
              <p className="muted">
                License activated on: {new Date(state.activatedLicense.activated_at).toLocaleDateString()}
              </p>
              {state.activatedLicense.expires_at && (
                <p className="muted">
                  Expires: {new Date(state.activatedLicense.expires_at).toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </div>

        {state.edition !== 'licensed' && (
          <div className="panel">
            <h2>Upgrade to Premium</h2>
            <p>Get unlimited access to all SizeWise features:</p>
            <ul>
              <li>Unlimited projects</li>
              <li>Unlimited segments per project</li>
              <li>Advanced calculation tools</li>
              <li>Export capabilities</li>
              <li>Priority support</li>
            </ul>

            <div className="form-actions">
              <button
                onClick={() => router.push('/license/activate')}
                className="btn btn-primary"
              >
                Activate License Key
              </button>
              <a
                href="https://sizewise.app/purchase"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Purchase License
              </a>
            </div>
          </div>
        )}

        <div className="panel">
          <h2>About Offline Licensing</h2>
          <p className="muted">
            SizeWise uses offline licensing technology that works without an internet connection.
            Once you activate your license key, you can use the software completely offline.
          </p>
          <p className="muted">
            Your license is cryptographically verified and stored securely on your device.
          </p>
        </div>
      </div>
    </>
  );
}

