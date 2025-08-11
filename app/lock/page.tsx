'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/core/auth/AuthService';

export default function LockPage(){
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    setErr(undefined); setBusy(true);
    try {
      const accountId = await Auth.ensureLocalAccount();
      const session = await Auth.verifyPin(accountId, pin);
      await Auth.unlockWithSession(session);
      if (document.referrer && !document.referrer.includes('/lock')) router.back(); else router.replace('/dashboard');
    } catch (e:any) { setErr(e?.message ?? 'Failed to unlock'); } finally { setBusy(false); }
  };

  const biometric = async () => {
    try {
      const accountId = await Auth.ensureLocalAccount();
      const session = await Auth.authenticateWebAuthn(accountId);
      await Auth.unlockWithSession(session);
      location.replace('/dashboard');
    } catch (e:any) { setErr(e?.message ?? 'Biometrics unavailable'); }
  };

  return (
    <main className="container mx-auto p-8">
      <div className="max-w-md mx-auto rounded-2xl bg-white/5 backdrop-blur shadow-xl p-6">
        <h1 className="text-2xl font-semibold">Locked</h1>
        <p className="text-sm opacity-80">Unlock to access your projects.</p>

        <button type="button" data-testid="lock-bio-btn" className="w-full mt-6 rounded-lg px-4 py-2 bg-white/10 hover:bg-white/20" onClick={biometric}>Use Touch ID / Windows Hello</button>

        <div className="mt-5">
          <label className="block text-sm" htmlFor="pin">PIN</label>
          <div className="flex gap-2 mt-1">
            <input id="pin" data-testid="lock-pin-input" inputMode="numeric" pattern="[0-9]*" className="flex-1 rounded-lg bg-white/10 px-3 py-2" value={pin} onChange={(e)=>setPin(e.target.value)} />
            <button type="button" data-testid="lock-unlock-btn" className="rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60" onClick={unlock} disabled={busy}>{busy ? 'Unlocking…' : 'Unlock'}</button>
          </div>
          {err && <p id="lock-error" role="alert" aria-live="assertive" className="text-red-400 text-sm mt-2">{err}</p>}
        </div>

        <a className="inline-block mt-6 opacity-80 hover:opacity-100" href="/auth/manage">Manage methods</a>
      </div>
    </main>
  )
}
