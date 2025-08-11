import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'node:path';
import url from 'node:url';

const isProd = app.isPackaged;

function allowUrl(u: string) {
  if (u.startsWith('file:') || u.startsWith('app:') || u.startsWith('devtools:')) return true;
  if (!isProd && /^https?:\/\/localhost:3000\//i.test(u)) return true;
  return false;
}

function setupNetworkBlocking() {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const u = details.url;
    const isProd = app.isPackaged;
    const allowed = u.startsWith('file:') || u.startsWith('app:') || u.startsWith('devtools:') || (!isProd && /^https?:\/\/localhost:3000\//i.test(u));
    callback({ cancel: !allowed });
    if (!allowed) console.log('🚫 Blocked network request:', u);
  });
}

// Set up custom protocol for serving the Next.js app
function setupAppProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6); // Remove 'app://' prefix
    const filePath = path.join(__dirname, '../out', url || 'index.html');
    callback({ path: filePath });
  });
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
    // In development, load from the dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the built static files
    const indexPath = path.join(process.resourcesPath, 'web', 'index.html');
    mainWindow.loadFile(indexPath);
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
    console.log('🚫 Blocked new window creation:', url);
    return { action: 'deny' };
  });
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:3000' && !navigationUrl.startsWith('file:')) {
      event.preventDefault();
      console.log('🚫 Blocked navigation to:', navigationUrl);
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
