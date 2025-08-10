'use client';
// optional helper to ping SW status; used by UpdateToast internally
export async function getSWReg(){ return navigator.serviceWorker?.getRegistration(); }

