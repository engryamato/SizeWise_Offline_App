'use client';
import { useEffect, useState } from 'react';
import { listProjects } from '../db/dao';

export default function ProjectList() {
  const [rows, setRows] = useState<{id:string;name:string;updated_at:number}[]>([]);
  useEffect(() => { listProjects().then(setRows).catch(()=>{}); }, []);
  if (!rows.length) return <div className="panel">No projects yet. Create one to get started.</div>;
  return (
    <div className="grid">
      {rows.map(r => (
        <div className="panel" key={r.id}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <strong>{r.name}</strong>
            <small className="muted">{new Date(r.updated_at).toLocaleString()}</small>
          </div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button className="btn" onClick={()=>location.href=`/tools/air-duct-sizer?project=${r.id}`}>Open</button>
            <button className="btn" disabled>Duplicate</button>
            <button className="btn" disabled>Export</button>
          </div>
        </div>
      ))}
    </div>
  );
}

