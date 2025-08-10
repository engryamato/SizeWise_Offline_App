'use client';
export function flag(name: string, def = false){
  try {
    const v = sessionStorage.getItem(`ff_${name}`);
    return v ? v === '1' : def;
  } catch { return def; }
}
export function setFlag(name: string, on: boolean){
  try { sessionStorage.setItem(`ff_${name}`, on ? '1' : '0'); } catch {}
}

