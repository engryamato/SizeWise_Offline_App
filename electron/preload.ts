import { contextBridge } from 'electron';
import path from 'node:path';

// Validate filename for security
function validateSQLiteFilename(filename: string): boolean {
  if (typeof filename !== 'string') return false;

  // Only allow specific SQLite files
  const allowedFiles = ['sizewise.db', 'sizewise.db-wal', 'sizewise.db-shm'];
  return allowedFiles.includes(filename);
}

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getSQLitePath: (filename: string) => {
    // Validate the filename for security
    if (!validateSQLiteFilename(filename)) {
      throw new Error('Invalid SQLite filename');
    }

    const dev = process.env.NODE_ENV !== 'production';
    return dev ? `/sqlite/${filename}` : path.join(process.resourcesPath, 'web', 'sqlite', filename);
  }
});

declare global {
  interface Window {
    electronAPI: {
      isElectron: boolean;
      getSQLitePath: (filename: string) => string;
    };
  }
}
