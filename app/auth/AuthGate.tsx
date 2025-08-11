'use client';
import { useEffect } from 'react';

export default function AuthGate(){
  useEffect(()=>{
    const run = async () => {
      try {
        const { Auth } = await import('@/core/auth/AuthService');
        const { initIdleLock } = await import('@/core/auth/idleLock');
        let sess = Auth.currentSession();
        const { openDb } = await import('@/db/openDb');
        const db = await openDb() as any;
        const rows:any[] = [];
        db.exec({ sql: `SELECT 1 FROM accounts LIMIT 1`, rowMode: 'array', callback: (r:any)=>rows.push(r) });
        const hasAccount = rows.length > 0;

        // Restore session from DB if present but in-memory is empty (route reloads)
        if (!sess && hasAccount) {
          const s:any[] = [];
          db.exec({ sql: `SELECT id, account_id as accountId, created_at as createdAt, expires_at as expiresAt FROM sessions ORDER BY created_at DESC LIMIT 1`, rowMode: 'object', callback: (r:any)=>s.push(r) });
          if (s.length) {
            try { await Auth.unlockWithSession(s[0]); sess = s[0]; } catch {}
          }
        }

        const path = location.pathname;
        const isAuthRoute = path.startsWith('/auth') || path === '/lock';
        if (!hasAccount && !path.startsWith('/auth/onboarding')) {
          location.replace('/auth/onboarding'); return;
        }
        if (hasAccount && !sess && !isAuthRoute) {
          location.replace('/lock'); return;
        }
        // Start idle lock when we reach any page past onboarding/lock
        if (hasAccount && (sess || isAuthRoute)) initIdleLock();
      } catch (e) {
        // fail-soft
      }
    };
    run();
  },[]);
  return null;
}
