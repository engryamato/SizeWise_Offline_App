import { describe, it, expect } from 'vitest';
import {
  isAllowedUrl,
  validateFilePath,
  generateCSPHeader,
  generateSecureToken,
  validateProtocolScheme,
  validateFileName,
  CSP_POLICY,
  SECURITY_HEADERS
} from './security';

describe('[phase3] Security Utilities', () => {
  describe('isAllowedUrl', () => {
    it('allows file protocol URLs', () => {
      expect(isAllowedUrl('file:///path/to/file.html')).toBe(true);
    });

    it('allows app protocol URLs', () => {
      expect(isAllowedUrl('app://index.html')).toBe(true);
    });

    it('allows devtools protocol URLs', () => {
      expect(isAllowedUrl('devtools://devtools/bundled/inspector.html')).toBe(true);
    });

    it('allows localhost in development mode', () => {
      expect(isAllowedUrl('http://localhost:3000/dashboard', true)).toBe(true);
      expect(isAllowedUrl('https://localhost:3000/dashboard', true)).toBe(true);
    });

    it('blocks localhost in production mode', () => {
      expect(isAllowedUrl('http://localhost:3000/dashboard', false)).toBe(false);
    });

    it('blocks external URLs', () => {
      expect(isAllowedUrl('https://google.com')).toBe(false);
      expect(isAllowedUrl('http://malicious-site.com')).toBe(false);
      expect(isAllowedUrl('ftp://example.com')).toBe(false);
    });

    it('handles invalid URLs gracefully', () => {
      expect(isAllowedUrl('not-a-url')).toBe(false);
      expect(isAllowedUrl('')).toBe(false);
    });
  });

  describe('validateFilePath', () => {
    it('accepts valid relative paths', () => {
      expect(validateFilePath('index.html')).toBe(true);
      expect(validateFilePath('assets/style.css')).toBe(true);
      expect(validateFilePath('js/app.js')).toBe(true);
    });

    it('rejects directory traversal attempts', () => {
      expect(validateFilePath('../../../etc/passwd')).toBe(false);
      expect(validateFilePath('..\\..\\windows\\system32')).toBe(false);
      expect(validateFilePath('folder/../../../secret')).toBe(false);
    });

    it('rejects absolute paths', () => {
      expect(validateFilePath('/etc/passwd')).toBe(false);
      expect(validateFilePath('C:\\Windows\\System32')).toBe(false);
    });

    it('rejects paths with null bytes', () => {
      expect(validateFilePath('file\0.txt')).toBe(false);
    });

    it('rejects non-string inputs', () => {
      expect(validateFilePath(123 as any)).toBe(false);
      expect(validateFilePath(null as any)).toBe(false);
      expect(validateFilePath(undefined as any)).toBe(false);
    });
  });

  describe('generateCSPHeader', () => {
    it('generates valid CSP header string', () => {
      const csp = generateCSPHeader();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('includes all required directives', () => {
      const csp = generateCSPHeader();
      Object.keys(CSP_POLICY).forEach(directive => {
        expect(csp).toContain(directive);
      });
    });
  });

  describe('generateSecureToken', () => {
    it('generates tokens of correct length', () => {
      expect(generateSecureToken(16)).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(generateSecureToken(32)).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('generates different tokens each time', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('generates only hex characters', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('validateProtocolScheme', () => {
    it('accepts allowed schemes', () => {
      expect(validateProtocolScheme('app')).toBe(true);
      expect(validateProtocolScheme('file')).toBe(true);
      expect(validateProtocolScheme('devtools')).toBe(true);
    });

    it('rejects disallowed schemes', () => {
      expect(validateProtocolScheme('http')).toBe(false);
      expect(validateProtocolScheme('https')).toBe(false);
      expect(validateProtocolScheme('ftp')).toBe(false);
      expect(validateProtocolScheme('javascript')).toBe(false);
    });
  });

  describe('validateFileName', () => {
    it('accepts valid filenames', () => {
      expect(validateFileName('document.txt')).toBe(true);
      expect(validateFileName('my-file_123.pdf')).toBe(true);
      expect(validateFileName('image.png')).toBe(true);
    });

    it('rejects filenames with dangerous characters', () => {
      expect(validateFileName('file<script>.txt')).toBe(false);
      expect(validateFileName('file|pipe.txt')).toBe(false);
      expect(validateFileName('file?.txt')).toBe(false);
      expect(validateFileName('file*.txt')).toBe(false);
    });

    it('rejects reserved Windows names', () => {
      expect(validateFileName('CON')).toBe(false);
      expect(validateFileName('PRN')).toBe(false);
      expect(validateFileName('AUX')).toBe(false);
      expect(validateFileName('COM1')).toBe(false);
      expect(validateFileName('LPT1')).toBe(false);
    });

    it('rejects filenames that are too long', () => {
      const longName = 'a'.repeat(256);
      expect(validateFileName(longName)).toBe(false);
    });

    it('rejects non-string inputs', () => {
      expect(validateFileName(123 as any)).toBe(false);
      expect(validateFileName(null as any)).toBe(false);
    });
  });

  describe('SECURITY_HEADERS', () => {
    it('includes all required security headers', () => {
      expect(SECURITY_HEADERS).toHaveProperty('Content-Security-Policy');
      expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options');
      expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options');
      expect(SECURITY_HEADERS).toHaveProperty('X-XSS-Protection');
      expect(SECURITY_HEADERS).toHaveProperty('Referrer-Policy');
      expect(SECURITY_HEADERS).toHaveProperty('Permissions-Policy');
      expect(SECURITY_HEADERS).toHaveProperty('Strict-Transport-Security');
    });

    it('has secure values for headers', () => {
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
      expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block');
    });
  });
});
