'use client';
import { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import ToolCard from '../../components/ToolCard';
import ProjectList from '../../components/ProjectList';
import UpdateToast from '../../components/UpdateToast';
import { bootstrapLicense } from '../../lib/licensing';
import { initDb } from '../../db/dao';

export default function Dashboard(){
  const [ready, setReady] = useState(false);
  useEffect(()=>{ (async()=>{ await bootstrapLicense(); await initDb(); setReady(true); })(); },[]);
  if (!ready) return <div className="center"><div className="panel">Loading offline engine…</div></div>;
  return (
    <>
      <NavBar />
      <div className="container">
        <div className="hero">
          <div>
            <h1>Dashboard</h1>
            <div className="muted">Select a tool or open a project.</div>
          </div>
        </div>
        <div className="grid" style={{marginBottom:20}}>
          <ToolCard title="Air Duct Sizer" subtitle="Draw ducts. Live airflow & pressure." href="/tools/air-duct-sizer" />
          <div className="card" aria-disabled>
            <div className="badge">Coming soon</div>
            <h3>Grease Duct Sizer</h3>
            <div className="muted">NFPA 96 ruleset</div>
          </div>
        </div>
        <h3>Projects</h3>
        <ProjectList />
      </div>
      <UpdateToast />
    </>
  );
}

