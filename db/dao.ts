import { openDb } from './openDb';
import { migrate } from './migrations';
import { ulid } from '../lib/ids';
import { FREE_LIMITS } from '../lib/licensing';
import { DeviceVault } from '../lib/vault';

// Error types for free tier limits
export class FreeTierLimitError extends Error {
  constructor(public code: string, message: string, public limit: number, public current: number) {
    super(message);
    this.name = 'FreeTierLimitError';
  }
}

export async function initDb(){ await migrate(); }

export async function listProjects(): Promise<{id:string; name:string; updated_at:number}[]> {
  const db = await openDb();
  const rows: any[] = [];
  (db as any).exec({ sql: `SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC`, rowMode: 'object', callback: (r:any)=>rows.push(r) });
  return rows as any;
}

export async function createProject(name: string, unit: 'imperial'|'si', category: string = 'residential', description: string = ''){
  // Check free tier limits
  const currentProjectCount = await countProjects();
  if (currentProjectCount >= FREE_LIMITS.maxProjects) {
    throw new FreeTierLimitError(
      'MAX_PROJECTS_EXCEEDED',
      `Free tier allows maximum ${FREE_LIMITS.maxProjects} projects. You currently have ${currentProjectCount}.`,
      FREE_LIMITS.maxProjects,
      currentProjectCount
    );
  }

  const db = await openDb();
  const now = Date.now();
  const id = ulid();

  // Insert into both projects and project_heads tables
  (db as any).exec(`INSERT INTO projects(id,name,unit_system,rules_version,created_at,updated_at) VALUES(?,?,?,?,?,?)`, [id, name, unit, 'smacna-4e@1.0.0', now, now]);
  (db as any).exec(`INSERT INTO project_heads(project_id,name,category,description,unit_system,rules_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`, [id, name, category, description, unit, 'smacna-4e@1.0.0', now, now]);

  // Create encrypted snapshot of the new project
  try {
    const projectData = {
      id,
      name,
      category,
      description,
      unit_system: unit,
      rules_version: 'smacna-4e@1.0.0',
      created_at: now,
      junctions: [],
      segments: []
    };
    await DeviceVault.createSnapshot(id, projectData, 'create');
  } catch (error) {
    console.warn('Failed to create project snapshot:', error);
    // Don't fail project creation if snapshot fails
  }

  return id;
}

// Junction management
export async function listJunctions(projectId: string): Promise<{id:string; kind:string; x:number; y:number; z:number}[]> {
  const db = await openDb();
  const rows: any[] = [];
  (db as any).exec({ sql: `SELECT id, kind, x, y, z FROM junctions WHERE project_id = ? ORDER BY created_at`, rowMode: 'object', callback: (r:any)=>rows.push(r) });
  return rows as any;
}

export async function createJunction(projectId: string, kind: string, x: number, y: number, z: number = 0, meta: any = {}){
  const db = await openDb();
  const id = ulid();
  (db as any).exec(`INSERT INTO junctions(id,project_id,kind,x,y,z,meta_json) VALUES(?,?,?,?,?,?,?)`, [id, projectId, kind, x, y, z, JSON.stringify(meta)]);
  return id;
}

// Segment management
export async function listSegments(projectId: string): Promise<{id:string; kind:string; junction_from:string; junction_to:string; A:number; Dh:number; L:number}[]> {
  const db = await openDb();
  const rows: any[] = [];
  (db as any).exec({ sql: `SELECT id, kind, junction_from, junction_to, A, Dh, L FROM segments WHERE project_id = ? ORDER BY created_at`, rowMode: 'object', callback: (r:any)=>rows.push(r) });
  return rows as any;
}

export async function createSegment(projectId: string, kind: string, junctionFrom: string, junctionTo: string, A: number, Dh: number, L: number, k: number = 0.0015, K: number = 0, geom: any = {}, meta: any = {}){
  // Check free tier limits for segments per project
  const currentSegmentCount = await countSegments(projectId);
  if (currentSegmentCount >= FREE_LIMITS.maxEdgesPerProject) {
    throw new FreeTierLimitError(
      'MAX_SEGMENTS_EXCEEDED',
      `Free tier allows maximum ${FREE_LIMITS.maxEdgesPerProject} segments per project. This project currently has ${currentSegmentCount}.`,
      FREE_LIMITS.maxEdgesPerProject,
      currentSegmentCount
    );
  }

  const db = await openDb();
  const id = ulid();
  (db as any).exec(`INSERT INTO segments(id,project_id,kind,junction_from,junction_to,A,Dh,L,k,K,geom_json,meta_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`, [id, projectId, kind, junctionFrom, junctionTo, A, Dh, L, k, K, JSON.stringify(geom), JSON.stringify(meta)]);
  return id;
}

export async function countSegments(projectId: string): Promise<number> {
  const db = await openDb();
  return (db as any).selectValue(`SELECT COUNT(*) FROM segments WHERE project_id = ?`, [projectId]) || 0;
}

export async function countProjects(): Promise<number> {
  const db = await openDb();
  return (db as any).selectValue(`SELECT COUNT(*) FROM projects`) || 0;
}

// Free tier validation helpers
export async function canCreateProject(): Promise<{allowed: boolean; reason?: string; current: number; limit: number}> {
  const current = await countProjects();
  const allowed = current < FREE_LIMITS.maxProjects;
  return {
    allowed,
    reason: allowed ? undefined : `Maximum ${FREE_LIMITS.maxProjects} projects allowed in free tier`,
    current,
    limit: FREE_LIMITS.maxProjects
  };
}

export async function canCreateSegment(projectId: string): Promise<{allowed: boolean; reason?: string; current: number; limit: number}> {
  const current = await countSegments(projectId);
  const allowed = current < FREE_LIMITS.maxEdgesPerProject;
  return {
    allowed,
    reason: allowed ? undefined : `Maximum ${FREE_LIMITS.maxEdgesPerProject} segments allowed per project in free tier`,
    current,
    limit: FREE_LIMITS.maxEdgesPerProject
  };
}

// Get complete project data for snapshots
export async function getProjectData(projectId: string): Promise<any> {
  const db = await openDb();

  // Get project info
  const projectInfo = (db as any).selectObjects(`SELECT * FROM projects WHERE id = ?`, [projectId])[0];
  const projectHead = (db as any).selectObjects(`SELECT * FROM project_heads WHERE project_id = ?`, [projectId])[0];

  // Get junctions
  const junctions = (db as any).selectObjects(`SELECT * FROM junctions WHERE project_id = ?`, [projectId]);

  // Get segments
  const segments = (db as any).selectObjects(`SELECT * FROM segments WHERE project_id = ?`, [projectId]);

  return {
    ...projectInfo,
    ...projectHead,
    junctions,
    segments,
    snapshot_created_at: Date.now()
  };
}

// Create a project snapshot (for manual backups or major edits)
export async function createProjectSnapshot(projectId: string, type: 'save' | 'close' | 'manual' = 'manual'): Promise<string> {
  try {
    const projectData = await getProjectData(projectId);
    const snapshotId = await DeviceVault.createSnapshot(projectId, projectData, type);

    // Clean up old snapshots (keep only 5 most recent)
    await DeviceVault.cleanupSnapshots(projectId, 5);

    return snapshotId;
  } catch (error) {
    console.warn('Failed to create project snapshot:', error);
    return '';
  }
}

