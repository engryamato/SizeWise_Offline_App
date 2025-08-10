'use client';
import { useEffect, useRef } from 'react';
import NavBar from '../../../components/NavBar';

export default function AirDuctSizerPage(){
  const hostRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    if (!hostRef.current) return;
    hostRef.current.innerHTML = '';
    const el = document.createElement('div');
    el.textContent = '3D Canvas Placeholder — plug R3F/Three here (Phase 2)';
    el.className = 'panel';
    el.style.padding = '24px';
    hostRef.current.appendChild(el);
  },[]);
  return (
    <>
      <NavBar />
      <div className="container">
        <h1 style={{margin:'6px 0 18px'}}>Air Duct Sizer</h1>
        <div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
          <div ref={hostRef} />
          <div className="panel">
            <h3 style={{marginTop:0}}>Properties</h3>
            <div className="muted">Inputs and live results will appear here.</div>
          </div>
        </div>
      </div>
    </>
  );
}

