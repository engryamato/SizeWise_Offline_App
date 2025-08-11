'use client';
// Offline trial → free tier licensing
// Stores authoritative values in OPFS (via SQLite later); mirrors status in localStorage for early UI

export type Edition = 'trial'|'free'|'licensed';
const LS_KEY = 'sw_license';

function readLS(){
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeLS(v:any){ try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
}

export async function bootstrapLicense(){
  const now = Date.now();
  const cur = readLS();
  if (!cur) {
    const trialDays = 14;
    const state = { edition: 'trial', install_at: now, trial_ends_at: now + trialDays*86400000, last_run_at: now, clock_tamper_detected: false };
    writeLS(state);
    return state;
  }
  // clock tamper detection (basic): if now < last_run_at by more than 24h, drop to free
  const clockTamperDetected = now + 86400000 < cur.last_run_at;
  if (clockTamperDetected) {
    cur.edition = 'free';
    cur.clock_tamper_detected = true;
  }
  cur.last_run_at = now;
  if (cur.edition === 'trial' && now > cur.trial_ends_at) cur.edition = 'free';
  writeLS(cur);
  return cur;
}

export async function getEdition(): Promise<Edition> {
  const cur = readLS();
  return (cur?.edition ?? 'trial') as Edition;
}

export async function getTrialInfo(){
  const cur = readLS();
  const now = Date.now();
  const daysLeft = cur?.trial_ends_at ? Math.max(0, Math.ceil((cur.trial_ends_at - now)/86400000)) : 0;
  return {
    daysLeft,
    clockTamperDetected: cur?.clock_tamper_detected || false
  };
}

export async function getLicenseStatus(){
  const cur = readLS();
  const edition = await getEdition();
  const trialInfo = await getTrialInfo();

  return {
    edition,
    ...trialInfo,
    installDate: cur?.install_at ? new Date(cur.install_at) : null
  };
}

export const FREE_LIMITS = { maxProjects: 2, maxEdgesPerProject: 150 };

