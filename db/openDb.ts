// SQLite WASM + OPFS bootstrap
// Requires sqlite wasm assets in /public/sqlite/

export type DB = any; // narrow later
let dbPromise: Promise<DB> | null = null;

export async function openDb(): Promise<DB> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    // @ts-ignore - global module from sqlite wasm loader
    const sqlite3 = await (window as any).sqlite3InitModule({ locateFile: (f: string) => `/sqlite/${f}` });
    const db = new sqlite3.oo1.OpfsDb('sizewise.db');
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`);
    return db;
  })();
  return dbPromise;
}

