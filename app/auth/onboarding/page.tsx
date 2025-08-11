'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/core/auth/AuthService';

export default function OnboardingPage(){
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [bioSupported, setBioSupported] = useState(false);
  const [bioChoice, setBioChoice] = useState<'enable'|'later'>('later');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  useEffect(()=>{
    (async () => {
      try {
        const ok = !!(window.PublicKeyCredential && await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable?.());
        setBioSupported(ok);
        setBioChoice(ok ? 'enable' : 'later');
      } catch {}
    })();
  },[]);

  const submit = async () => {
    setErr(undefined);
    if (!/^\d{6,10}$/.test(pin)) { setErr('PIN must be 6–10 digits.'); return; }
    if (pin !== pin2) { setErr('PINs do not match.'); return; }
    setBusy(true);
    try {
      const accountId = await Auth.ensureLocalAccount();
      await Auth.setPin(accountId, pin);
      if (bioChoice==='enable' && bioSupported) { try { await Auth.registerWebAuthn(accountId); } catch {} }
      const session = await Auth.verifyPin(accountId, pin);
      await Auth.unlockWithSession(session);
      router.push('/dashboard');
    } catch(e:any) { setErr(e?.message ?? 'Failed to set PIN.'); } finally { setBusy(false); }
  };

  return (
    <main className="container mx-auto p-8">
      <div className="max-w-md mx-auto rounded-2xl bg-white/5 backdrop-blur shadow-xl p-6">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="text-sm opacity-75 mt-1">Create a PIN to protect your projects (offline).</p>

        <label className="block mt-6 text-sm" htmlFor="pin">PIN (6–10 digits)</label>
        <input id="pin" data-testid="onboard-pin" inputMode="numeric" pattern="[0-9]*" className="w-full mt-1 rounded-lg bg-white/10 px-3 py-2" value={pin} onChange={(e)=>setPin(e.target.value)} />

        <label className="block mt-4 text-sm" htmlFor="confirm">Confirm PIN</label>
        <input id="confirm" data-testid="onboard-pin-confirm" inputMode="numeric" pattern="[0-9]*" className="w-full mt-1 rounded-lg bg-white/10 px-3 py-2" value={pin2} onChange={(e)=>setPin2(e.target.value)} />

        <fieldset className="mt-5">
          <legend className="text-sm mb-2">Biometrics</legend>
          <label className="flex items-center gap-2 mb-1">
            <input type="radio" name="bio" value="enable" disabled={!bioSupported} checked={bioChoice==='enable'} onChange={()=>setBioChoice('enable')} />
            <span>Enable biometrics now {bioSupported ? '(Touch ID / Windows Hello)' : '(not supported)'}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="bio" value="later" checked={bioChoice==='later'} onChange={()=>setBioChoice('later')} />
            <span>I’ll add biometrics later</span>
          </label>
        </fieldset>

        {err && <p role="alert" className="text-red-400 text-sm mt-3">{err}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" data-testid="onboard-submit" onClick={submit} className="flex-1 rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60" disabled={busy}>{busy ? 'Setting up…' : 'Create PIN & Continue'}</button>
        </div>
      </div>
    </main>
  );
}
