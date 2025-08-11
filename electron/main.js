"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
// Register app:// as a privileged scheme for WebAuthn and fetch
electron_1.protocol.registerSchemesAsPrivileged?.([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);
// Security: Disable node integration and enable context isolation
const isDev = process.env.NODE_ENV === 'development';
// Block all outbound network requests for offline-first operation
function setupNetworkBlocking() {
    electron_1.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const url = details.url;
        // Allow only local file and app protocols
        if (url.startsWith('file:') || url.startsWith('app:') || url.startsWith('devtools:')) {
            callback({ cancel: false });
        }
        else {
            console.log('🚫 Blocked network request:', url);
            callback({ cancel: true });
        }
    });
}
// Set up custom protocol for serving the Next.js app
function setupAppProtocol() {
    electron_1.protocol.registerFileProtocol('app', (request, callback) => {
        const url = request.url.substr(6); // Remove 'app://' prefix
        const filePath = path.join(__dirname, '../out', url || 'index.html');
        callback({ path: filePath });
    });
}
function createWindow() {
    // Create the browser window with security hardening
    const mainWindow = new electron_1.BrowserWindow({
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
    if (isDev) {
        // In development, load from the dev server
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        // In production, load from the built static files
        const indexPath = path.join(__dirname, '../out/index.html');
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
electron_1.app.whenReady().then(() => {
    // Set up security measures
    setupNetworkBlocking();
    if (!isDev) {
        setupAppProtocol();
    }
    // Create the main window
    createWindow();
    electron_1.app.on('activate', () => {
        // On macOS, re-create window when dock icon is clicked
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed
electron_1.app.on('window-all-closed', () => {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Security: Prevent new window creation
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        console.log('🚫 Blocked new window creation:', navigationUrl);
    });
});
// Security: Prevent navigation to external URLs
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'http://localhost:3000' && !navigationUrl.startsWith('file:')) {
            event.preventDefault();
            console.log('🚫 Blocked navigation to:', navigationUrl);
        }
    });
});
// Additional security measures
electron_1.app.on('ready', () => {
    // Disable remote module
    if (electron_1.session.defaultSession) {
        electron_1.session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
            // Deny all permission requests for security
            callback(false);
        });
    }
});
