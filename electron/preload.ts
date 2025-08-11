import { contextBridge } from 'electron';
import path from 'node:path';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getSQLitePath: (filename: string) => {
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
