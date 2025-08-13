import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'node:path';
import url from 'node:url';
import { isAllowedUrl, validateFilePath, SECURITY_HEADERS, logSecurityEvent } from '../lib/security';

const isProd = app.isPackaged;

function allowUrl(u: string) {
  if (u.startsWith('file:') || u.startsWith('app:') || u.startsWith('devtools:')) return true;
  if (!isProd && /^https?:\/\/localhost:3000\//i.test(u)) return true;
  return false;
}

function setupNetworkBlocking() {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const u = details.url;
    const allowed = isAllowedUrl(u, !isProd);
    callback({ cancel: !allowed });
    if (!allowed) {
      logSecurityEvent('BLOCKED_NETWORK_REQUEST', { url: u, method: details.method });
    }
  });
}

// Set up custom protocol for serving the Next.js app
function setupAppProtocol() {
  protocol.handle('app', (request) => {
    const url = request.url.slice(6); // Remove 'app://' prefix

    // Validate the requested path for security
    if (!validateFilePath(url)) {
      logSecurityEvent('INVALID_FILE_PATH', { requestedPath: url });
      return new Response('Forbidden', { status: 403 });
    }

    const filePath = path.join(__dirname, '../out', url || 'index.html');

    // Ensure the resolved path is within the allowed directory
    const resolvedPath = path.resolve(filePath);
    const allowedDir = path.resolve(__dirname, '../out');

    if (!resolvedPath.startsWith(allowedDir)) {
      logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', { requestedPath: url, resolvedPath });
      return new Response('Forbidden', { status: 403 });
    }

    return new Response(require('fs').readFileSync(resolvedPath), {
      headers: {
        'Content-Type': getContentType(filePath),
        ...SECURITY_HEADERS
      }
    });
  });
}

// Helper function to determine content type
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };

  return contentTypes[ext] || 'application/octet-stream';
}

function createWindow() {
  // Create the browser window with security hardening
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security hardening
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),

      // Disable features that could compromise security
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },

    // App appearance
    title: 'SizeWise',
    icon: path.join(__dirname, '../public/icon-192x192.png'),
    show: false, // Don't show until ready
  });

  // Load the app
  console.log('[electron] createWindow: isProd=', isProd);

  if (!isProd) {
    // In development, load from the dev server - start with auth page
    mainWindow.loadURL('http://localhost:3000/auth');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the built static files - start with auth page
    const authPath = path.join(process.resourcesPath, 'web', 'auth.html');
    mainWindow.loadFile(authPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
  });

  return mainWindow;
}

// App event handlers
app.whenReady().then(() => {
  // Set up security measures
  setupNetworkBlocking();

  if (isProd) {
    setupAppProtocol();
  }

  // Create the main window
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    logSecurityEvent('BLOCKED_NEW_WINDOW', { url });
    return { action: 'deny' };
  });
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    if (!isAllowedUrl(navigationUrl, !isProd)) {
      event.preventDefault();
      logSecurityEvent('BLOCKED_NAVIGATION', { url: navigationUrl });
    }
  });
});

// Additional security measures
app.on('ready', () => {
  // Disable remote module
  if (session.defaultSession) {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      // Deny all permission requests for security
      callback(false);
    });
  }
});
