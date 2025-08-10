'use client';
import { useEffect, useState } from 'react';
import { getEdition, getTrialInfo } from '../lib/licensing';
export default function LicenseBadge(){
  const [label, setLabel] = useState('');
  useEffect(()=>{ (async()=>{
    const ed = await getEdition();
    if (ed === 'trial') {
      const t = await getTrialInfo();
      setLabel(`Trial: ${t.daysLeft} days left`);
    } else if (ed === 'free') setLabel('Free Tier');
    else setLabel('Licensed');
  })(); },[]);
  return <div className="badge" role="status" aria-live="polite">{label}</div>;
}

