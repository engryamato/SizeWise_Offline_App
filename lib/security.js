"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_CONFIG = exports.SESSION_CONFIG = exports.SECURITY_HEADERS = exports.CSP_POLICY = void 0;
exports.generateCSPHeader = generateCSPHeader;
exports.isAllowedUrl = isAllowedUrl;
exports.validateFilePath = validateFilePath;
exports.generateSecureToken = generateSecureToken;
exports.validateProtocolScheme = validateProtocolScheme;
exports.logSecurityEvent = logSecurityEvent;
exports.validateFileName = validateFileName;
// Security utilities and configurations
// Content Security Policy for enhanced XSS protection
exports.CSP_POLICY = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Next.js
    'style-src': ["'self'", "'unsafe-inline'"], // unsafe-inline needed for styled components
    'img-src': ["'self'", "data:", "blob:"],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'worker-src': ["'self'"],
    'frame-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
};
// Convert CSP policy object to header string
function generateCSPHeader() {
    return Object.entries(exports.CSP_POLICY)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}
// Security headers for enhanced protection
exports.SECURITY_HEADERS = {
    'Content-Security-Policy': generateCSPHeader(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
// URL validation for Electron navigation
function isAllowedUrl(url, isDev = false) {
    try {
        const parsedUrl = new URL(url);
        // Allow file protocol for local files
        if (parsedUrl.protocol === 'file:') {
            return true;
        }
        // Allow app protocol for custom protocol
        if (parsedUrl.protocol === 'app:') {
            return true;
        }
        // Allow devtools in development
        if (parsedUrl.protocol === 'devtools:') {
            return true;
        }
        // Allow localhost in development
        if (isDev && parsedUrl.hostname === 'localhost' && parsedUrl.port === '3000') {
            return true;
        }
        // Block all other URLs
        return false;
    }
    catch (error) {
        // Invalid URL format
        return false;
    }
}
// Validate file paths to prevent directory traversal
function validateFilePath(filePath) {
    if (typeof filePath !== 'string')
        return false;
    // Normalize the path
    const normalized = filePath.replace(/\\/g, '/');
    // Check for directory traversal attempts
    if (normalized.includes('../') || normalized.includes('..\\')) {
        return false;
    }
    // Check for absolute paths (should be relative)
    if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
        return false;
    }
    // Check for null bytes
    if (normalized.includes('\0')) {
        return false;
    }
    return true;
}
// Secure random string generation
function generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
// Session timeout configuration
exports.SESSION_CONFIG = {
    TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    MAX_SESSIONS_PER_ACCOUNT: 3
};
// Rate limiting configuration
exports.RATE_LIMIT_CONFIG = {
    PIN_ATTEMPTS: {
        MAX_ATTEMPTS: 5,
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        LOCKOUT_MS: 5 * 60 * 1000 // 5 minutes after max attempts
    },
    API_REQUESTS: {
        MAX_REQUESTS: 100,
        WINDOW_MS: 60 * 1000 // 1 minute
    }
};
// Validate Electron protocol schemes
function validateProtocolScheme(scheme) {
    const allowedSchemes = ['app', 'file', 'devtools'];
    return allowedSchemes.includes(scheme);
}
// Security event logging
function logSecurityEvent(event, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        event,
        details,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    console.warn('[SECURITY]', logEntry);
    // In production, you might want to send this to a security monitoring service
    // For now, we'll just log to console
}
// Validate and sanitize file names
function validateFileName(fileName) {
    if (typeof fileName !== 'string')
        return false;
    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(fileName)) {
        return false;
    }
    // Check for reserved names (Windows)
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(fileName)) {
        return false;
    }
    // Check length
    if (fileName.length > 255) {
        return false;
    }
    return true;
}
//# sourceMappingURL=security.js.map