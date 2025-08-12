import { describe, it, expect } from 'vitest';
import { 
  validateProjectName, 
  validateProjectDescription, 
  validatePin, 
  validateUlid,
  validateNumeric,
  sanitizeHtml 
} from '../lib/inputValidation';
import { 
  isAllowedUrl, 
  validateFilePath, 
  validateFileName,
  generateSecureToken 
} from '../lib/security';

describe('[phase5] Security Unit Tests', () => {
  describe('SQL Injection Prevention', () => {
    it('rejects malicious SQL in project names', () => {
      const maliciousInputs = [
        "'; DROP TABLE projects; --",
        "' OR '1'='1",
        "'; DELETE FROM projects WHERE 1=1; --",
        "' UNION SELECT * FROM users; --"
      ];

      maliciousInputs.forEach(input => {
        const result = validateProjectName(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });

    it('rejects malicious SQL in descriptions', () => {
      const maliciousDesc = "'; DELETE FROM projects WHERE 1=1; --";
      const result = validateProjectDescription(maliciousDesc);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });

  describe('XSS Prevention', () => {
    it('removes script tags', () => {
      const inputs = [
        '<script>alert("xss")</script>',
        '<SCRIPT>alert("xss")</SCRIPT>',
        '<script src="malicious.js"></script>'
      ];

      inputs.forEach(input => {
        expect(sanitizeHtml(input)).toBe('');
      });
    });

    it('removes event handlers', () => {
      const inputs = [
        'onclick="alert(1)"',
        'onload="malicious()"',
        'onerror="steal_data()"'
      ];

      inputs.forEach(input => {
        expect(sanitizeHtml(input)).toBe('');
      });
    });

    it('removes javascript protocols', () => {
      expect(sanitizeHtml('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeHtml('JAVASCRIPT:alert(1)')).toBe('alert(1)');
    });

    it('removes data protocols', () => {
      expect(sanitizeHtml('data:text/html,<script>alert(1)</script>')).toBe('text/html,');
    });

    it('preserves safe content', () => {
      const safeInputs = [
        'This is safe text',
        'Numbers 123 and symbols !@#',
        'Email: user@example.com'
      ];

      safeInputs.forEach(input => {
        expect(sanitizeHtml(input)).toBe(input);
      });
    });
  });

  describe('Input Validation Security', () => {
    it('enforces length limits to prevent buffer overflow', () => {
      const longName = 'a'.repeat(101);
      const result = validateProjectName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('100 characters or less');
    });

    it('validates numeric inputs to prevent injection', () => {
      const invalidNumbers = ['NaN', 'Infinity', '-Infinity', 'undefined', 'null'];
      
      invalidNumbers.forEach(input => {
        const result = validateNumeric(input);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('valid number');
      });
    });

    it('validates PIN format to prevent bypass', () => {
      const invalidPins = [
        '123', // too short
        '12345678901', // too long
        'abcdef', // non-numeric after sanitization becomes empty
        '', // empty
        '   ' // whitespace only
      ];

      invalidPins.forEach(pin => {
        const result = validatePin(pin);
        expect(result.isValid).toBe(false);
      });
    });

    it('validates ULID format to prevent ID manipulation', () => {
      const invalidIds = [
        'invalid-id',
        '123',
        '',
        'a'.repeat(25), // too long
        'a'.repeat(23), // too short
        '01abcdef0123456789abcde!', // invalid character
      ];

      invalidIds.forEach(id => {
        const result = validateUlid(id);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid ID format');
      });
    });
  });

  describe('File Path Security', () => {
    it('prevents directory traversal attacks', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        'folder/../../../secret',
        '..\\..\\..\\etc\\shadow',
        'normal/path/../../secret'
      ];

      maliciousPaths.forEach(path => {
        expect(validateFilePath(path)).toBe(false);
      });
    });

    it('prevents absolute path access', () => {
      const absolutePaths = [
        '/etc/passwd',
        'C:\\Windows\\System32',
        '/usr/bin/bash',
        'D:\\sensitive\\data'
      ];

      absolutePaths.forEach(path => {
        expect(validateFilePath(path)).toBe(false);
      });
    });

    it('prevents null byte injection', () => {
      const nullBytePaths = [
        'file\0.txt',
        'normal\0../../etc/passwd',
        'file.txt\0.exe'
      ];

      nullBytePaths.forEach(path => {
        expect(validateFilePath(path)).toBe(false);
      });
    });

    it('allows safe relative paths', () => {
      const safePaths = [
        'index.html',
        'assets/style.css',
        'js/app.js',
        'images/logo.png'
      ];

      safePaths.forEach(path => {
        expect(validateFilePath(path)).toBe(true);
      });
    });
  });

  describe('URL Security', () => {
    it('blocks external URLs in production', () => {
      const externalUrls = [
        'https://google.com',
        'http://malicious-site.com',
        'ftp://example.com',
        'https://cdn.jsdelivr.net/malicious.js'
      ];

      externalUrls.forEach(url => {
        expect(isAllowedUrl(url, false)).toBe(false);
      });
    });

    it('allows safe protocols', () => {
      const safeUrls = [
        'file:///path/to/file.html',
        'app://index.html',
        'devtools://devtools/bundled/inspector.html'
      ];

      safeUrls.forEach(url => {
        expect(isAllowedUrl(url, false)).toBe(true);
      });
    });

    it('allows localhost only in development', () => {
      expect(isAllowedUrl('http://localhost:3000/dashboard', true)).toBe(true);
      expect(isAllowedUrl('http://localhost:3000/dashboard', false)).toBe(false);
    });
  });

  describe('Filename Security', () => {
    it('rejects dangerous filename characters', () => {
      const dangerousNames = [
        'file<script>.txt',
        'file|pipe.txt',
        'file?.txt',
        'file*.txt',
        'file"quote.txt',
        'file:colon.txt'
      ];

      dangerousNames.forEach(name => {
        expect(validateFileName(name)).toBe(false);
      });
    });

    it('rejects reserved Windows names', () => {
      const reservedNames = ['CON', 'PRN', 'AUX', 'COM1', 'LPT1', 'NUL'];

      reservedNames.forEach(name => {
        expect(validateFileName(name)).toBe(false);
      });
    });

    it('accepts safe filenames', () => {
      const safeNames = [
        'document.txt',
        'my-file_123.pdf',
        'image.png',
        'data-2023.json'
      ];

      safeNames.forEach(name => {
        expect(validateFileName(name)).toBe(true);
      });
    });
  });

  describe('Cryptographic Security', () => {
    it('generates secure random tokens', () => {
      const token1 = generateSecureToken(16);
      const token2 = generateSecureToken(16);
      
      expect(token1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token2).toHaveLength(32);
      expect(token1).not.toBe(token2); // Should be different
      expect(token1).toMatch(/^[0-9a-f]+$/); // Only hex characters
    });

    it('generates tokens of requested length', () => {
      expect(generateSecureToken(8)).toHaveLength(16);
      expect(generateSecureToken(32)).toHaveLength(64);
      expect(generateSecureToken(64)).toHaveLength(128);
    });
  });
});
