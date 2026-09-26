'use client';
import { useEffect, useState } from 'react';
import { listProjects } from '../db/dao';
import NewProjectModal from './NewProjectModal';

export default function ProjectList() {
  const [rows, setRows] = useState<{id:string;name:string;updated_at:number}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProjects = () => {
    listProjects().then(setRows).catch(()=>{});
  };

  useEffect(() => { loadProjects(); }, []);

  const handleProjectCreated = (projectId: string) => {
    // Refresh the project list
    loadProjects();
    // Optionally navigate to the new project
    // location.href = `/tools/duct-sizer?project=${projectId}`;
  };

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div></div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          New Project
        </button>
      </div>

      {!rows.length ? (
        <div className="panel">
          <div>No projects yet. Create one to get started.</div>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{marginTop:12}}
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid">
          {rows.map(r => (
            <div className="panel" key={r.id}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <strong>{r.name}</strong>
                <small className="muted">{new Date(r.updated_at).toLocaleString()}</small>
              </div>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button className="btn" onClick={()=>location.href=`/tools/duct-sizer?project=${r.id}`}>Open</button>
                <button className="btn" disabled>Duplicate</button>
                <button className="btn" disabled>Export</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}

