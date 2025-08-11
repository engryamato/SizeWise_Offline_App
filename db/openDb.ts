// SQLite WASM + OPFS bootstrap
// Requires sqlite wasm assets in /public/sqlite/

export type DB = any; // narrow later
let dbPromise: Promise<DB> | null = null;

export async function openDb(): Promise<DB> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    // @ts-ignore - global module from sqlite wasm loader
    // Determine SQLite file location based on environment
    const locateFile = (file: string) => {
      // Check if running in Electron
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        return (window as any).electronAPI.getSQLitePath(file);
      }

      // Default web path
      return `/sqlite/${file}`;
    };

    const sqlite3 = await (window as any).sqlite3InitModule({ locateFile });
    const db = new sqlite3.oo1.OpfsDb('sizewise.db');
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`);
    return db;
  })();
  return dbPromise;
}

