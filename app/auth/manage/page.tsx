'use client';
import { useState } from 'react';
import { Auth } from '@/core/auth/AuthService';

export default function ManageAuthPage(){
  const [curr, setCurr] = useState(''); const [pin, setPin] = useState(''); const [pin2, setPin2] = useState('');
  const [msg, setMsg] = useState<string>(); const [err, setErr] = useState<string>();

  const change = async () => {
    setErr(undefined); setMsg(undefined);
    if (!/^\d{6,10}$/.test(pin)) { setErr('New PIN must be 6–10 digits.'); return; }
    if (pin !== pin2) { setErr('PINs do not match.'); return; }
    try {
      const accountId = await Auth.ensureLocalAccount();
      await Auth.verifyPin(accountId, curr);
      await Auth.setPin(accountId, pin);
      setMsg('PIN updated.'); setCurr(''); setPin(''); setPin2('');
    } catch (e:any) { setErr(e?.message ?? 'Failed to change PIN'); }
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-semibold">Manage Authentication</h1>

      <section className="mt-6 max-w-md rounded-2xl bg-white/5 backdrop-blur shadow p-6">
        <h2 className="text-xl font-medium">Change PIN</h2>
        <label className="block mt-4 text-sm" htmlFor="pin-current">Current PIN</label>
        <input id="pin-current" inputMode="numeric" pattern="[0-9]*" className="w-full mt-1 rounded-lg bg-white/10 px-3 py-2" value={curr} onChange={(e)=>setCurr(e.target.value)} />
        <label className="block mt-3 text-sm" htmlFor="pin-new">New PIN (6–10 digits)</label>
        <input id="pin-new" inputMode="numeric" pattern="[0-9]*" className="w-full mt-1 rounded-lg bg-white/10 px-3 py-2" value={pin} onChange={(e)=>setPin(e.target.value)} />
        <label className="block mt-3 text-sm" htmlFor="pin-confirm">Confirm</label>
        <input id="pin-confirm" inputMode="numeric" pattern="[0-9]*" className="w-full mt-1 rounded-lg bg-white/10 px-3 py-2" value={pin2} onChange={(e)=>setPin2(e.target.value)} />
        {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
        {msg && <p className="text-emerald-400 text-sm mt-3">{msg}</p>}
        <button type="button" className="mt-4 rounded-lg px-4 py-2 bg-blue-600 hover:bg-blue-500" onClick={change}>Change PIN</button>
      </section>

      <section className="mt-6 max-w-md rounded-2xl bg-white/5 backdrop-blur shadow p-6">
        <h2 className="text-xl font-medium">Biometrics (WebAuthn)</h2>
        <p className="text-sm opacity-80">Add or remove credentials (coming soon).</p>
        <div className="mt-3 flex gap-2">
          <button type="button" className="rounded-lg px-3 py-2 bg-white/10">Add Credential</button>
          <button type="button" className="rounded-lg px-3 py-2 bg-white/10">Remove Selected</button>
        </div>
      </section>
    </main>
  )
}
