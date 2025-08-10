'use client';
import { useEffect, useState } from 'react';
export default function UpdateToast(){
  const [show, setShow] = useState(false);
  useEffect(()=>{
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then((reg)=>{
      if (!reg) return;
      reg.addEventListener('updatefound', ()=>setShow(true));
    });
  },[]);
  if (!show) return null;
  return <div className="toast">Update available. <button className="btn" onClick={()=>location.reload()}>Reload</button></div>;
}

