'use client';
import { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import { bootstrapLicense, getEdition, getTrialInfo, FREE_LIMITS } from '../../lib/licensing';

export default function LicensePage(){
  const [state, setState] = useState({ edition: 'trial', daysLeft: 0 });
  useEffect(()=>{ (async()=>{
    await bootstrapLicense();
    const ed = await getEdition();
    const t = await getTrialInfo();
    setState({ edition: ed, daysLeft: t.daysLeft });
  })(); },[]);
  return (
    <>
      <NavBar />
      <div className="container">
        <h1>License & Limits</h1>
        <div className="panel">
          <p>Edition: <strong>{state.edition}</strong></p>
          {state.edition==='trial' && <p>Trial days left: <strong>{state.daysLeft}</strong></p>}
          {state.edition==='free' && (
            <ul>
              <li>Max projects: {FREE_LIMITS.maxProjects}</li>
              <li>Max edges per project: {FREE_LIMITS.maxEdgesPerProject}</li>
            </ul>
          )}
          <p className="muted">Offline licensing — no sign-in required.</p>
        </div>
      </div>
    </>
  );
}

