'use client';
import { Auth } from './AuthService';

let timer: any;
const TIMEOUT_MS = 15 * 60_000; // 15 minutes

function reset() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    Auth.lock();
    if (location.pathname !== '/lock') location.replace('/lock');
  }, TIMEOUT_MS);
}

export function initIdleLock(){
  ['mousemove','keydown','focus','click','touchstart','scroll','visibilitychange'].forEach(ev=>{
    window.addEventListener(ev, reset, { passive: true });
  });
  reset();
}

