import { openDb } from './openDb';

export async function migrate(){
  const db = await openDb();
  db.exec(`CREATE TABLE IF NOT EXISTS migrations(id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);`);
  const apply = (id: string, sql: string) => {
    const row = (db as any).selectValue?.(`SELECT id FROM migrations WHERE id = ?`, [id]);
    if (row) return;
    db.exec(sql);
    db.exec(`INSERT INTO migrations(id, applied_at) VALUES (?, ?)`, [id, Date.now()]);
  };

  apply('001_core',     `CREATE TABLE IF NOT EXISTS projects (       id TEXT PRIMARY KEY,       name TEXT NOT NULL,       unit_system TEXT NOT NULL,       rules_version TEXT NOT NULL,       created_at INTEGER NOT NULL,       updated_at INTEGER NOT NULL     );     CREATE TABLE IF NOT EXISTS nodes (       id TEXT PRIMARY KEY,       project_id TEXT NOT NULL,       kind TEXT NOT NULL,       x REAL NOT NULL, y REAL NOT NULL, z REAL NOT NULL,       fixed_pressure_pa REAL, fixed_flow_m3s REAL,       meta_json TEXT NOT NULL DEFAULT '{}'     );     CREATE TABLE IF NOT EXISTS edges (       id TEXT PRIMARY KEY,       project_id TEXT NOT NULL,       kind TEXT NOT NULL,       node_from TEXT NOT NULL,       node_to   TEXT NOT NULL,       A REAL NOT NULL, Dh REAL NOT NULL, L REAL NOT NULL, k REAL NOT NULL, K REAL DEFAULT 0,       geom_json TEXT NOT NULL,       meta_json TEXT NOT NULL DEFAULT '{}'     );     CREATE TABLE IF NOT EXISTS results (       project_id TEXT NOT NULL,       edge_id TEXT NOT NULL,       run_id TEXT NOT NULL,       computed_at INTEGER NOT NULL,       Q REAL NOT NULL, V REAL NOT NULL, Re REAL NOT NULL, f REAL NOT NULL, dP REAL NOT NULL,       PRIMARY KEY(project_id, edge_id, run_id)     );     CREATE TABLE IF NOT EXISTS results_latest (       project_id TEXT NOT NULL,       edge_id TEXT NOT NULL PRIMARY KEY,       run_id TEXT NOT NULL,       Q REAL NOT NULL, V REAL NOT NULL, Re REAL NOT NULL, f REAL NOT NULL, dP REAL NOT NULL     );`  );
}

