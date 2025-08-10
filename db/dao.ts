import { openDb } from './openDb';
import { migrate } from './migrations';
import { ulid } from '../lib/ids';

export async function initDb(){ await migrate(); }

export async function listProjects(): Promise<{id:string; name:string; updated_at:number}[]> {
  const db = await openDb();
  const rows: any[] = [];
  (db as any).exec({ sql: `SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC`, rowMode: 'object', callback: (r:any)=>rows.push(r) });
  return rows as any;
}

export async function createProject(name: string, unit: 'imperial'|'si'){
  const db = await openDb();
  const now = Date.now();
  const id = ulid();
  (db as any).exec(`INSERT INTO projects(id,name,unit_system,rules_version,created_at,updated_at) VALUES(?,?,?,?,?,?)`, [id, name, unit, 'smacna-4e@1.0.0', now, now]);
  return id;
}

