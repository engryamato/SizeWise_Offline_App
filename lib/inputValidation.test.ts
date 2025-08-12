import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateProjectName,
  validateProjectDescription,
  validatePin,
  validateCategory,
  validateUnitSystem,
  validateNumeric,
  validateUlid,
  validateGeneralText,
  validateJsonData,
  sanitizeHtml,
  RateLimiter,
  INPUT_LIMITS
} from './inputValidation';

describe('[phase2] Input Validation', () => {
  describe('sanitizeHtml', () => {
    it('removes dangerous HTML tags', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('');
    });

    it('removes javascript protocols', () => {
      expect(sanitizeHtml('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeHtml('JAVASCRIPT:alert(1)')).toBe('alert(1)');
    });

    it('removes event handlers', () => {
      expect(sanitizeHtml('onclick="alert(1)"')).toBe('');
      expect(sanitizeHtml('onload="malicious()"')).toBe('');
    });

    it('removes data protocols', () => {
      expect(sanitizeHtml('data:text/html,<script>alert(1)</script>')).toBe('text/html,');
    });

    it('preserves safe text content', () => {
      expect(sanitizeHtml('This is safe text')).toBe('This is safe text');
      expect(sanitizeHtml('Numbers 123 and symbols !@#')).toBe('Numbers 123 and symbols !@#');
    });
  });

  describe('validateProjectName', () => {
    it('accepts valid project names', () => {
      const result = validateProjectName('My Project');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('My Project');
    });

    it('rejects empty names', () => {
      const result = validateProjectName('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('rejects names that are too long', () => {
      const longName = 'a'.repeat(INPUT_LIMITS.PROJECT_NAME + 1);
      const result = validateProjectName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('characters or less');
    });

    it('rejects names with dangerous characters', () => {
      const result = validateProjectName('Project<script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('rejects non-string inputs', () => {
      const result = validateProjectName(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('validateProjectDescription', () => {
    it('accepts valid descriptions', () => {
      const result = validateProjectDescription('A good description');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('A good description');
    });

    it('accepts empty descriptions', () => {
      const result = validateProjectDescription('');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('');
    });

    it('rejects descriptions that are too long', () => {
      const longDesc = 'a'.repeat(INPUT_LIMITS.PROJECT_DESCRIPTION + 1);
      const result = validateProjectDescription(longDesc);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('characters or less');
    });

    it('rejects HTML in descriptions for security', () => {
      const result = validateProjectDescription('Description with <script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
  });

  describe('validatePin', () => {
    it('accepts valid PINs', () => {
      const result = validatePin('123456');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('123456');
    });

    it('removes non-numeric characters', () => {
      const result = validatePin('12-34-56');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('123456');
    });

    it('rejects PINs that are too short', () => {
      const result = validatePin('12345');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('rejects PINs that are too long', () => {
      const result = validatePin('12345678901');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('or less');
    });

    it('rejects non-string inputs', () => {
      const result = validatePin(123456 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('validateCategory', () => {
    it('accepts valid categories', () => {
      expect(validateCategory('residential').isValid).toBe(true);
      expect(validateCategory('commercial').isValid).toBe(true);
      expect(validateCategory('industrial').isValid).toBe(true);
    });

    it('rejects invalid categories', () => {
      const result = validateCategory('invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid category');
    });
  });

  describe('validateUnitSystem', () => {
    it('accepts valid unit systems', () => {
      expect(validateUnitSystem('imperial').isValid).toBe(true);
      expect(validateUnitSystem('si').isValid).toBe(true);
    });

    it('rejects invalid unit systems', () => {
      const result = validateUnitSystem('metric');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid unit system');
    });
  });

  describe('validateNumeric', () => {
    it('accepts valid numbers', () => {
      expect(validateNumeric('123.45').isValid).toBe(true);
      expect(validateNumeric(123.45).isValid).toBe(true);
    });

    it('rejects non-numeric values', () => {
      const result = validateNumeric('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('enforces minimum values', () => {
      const result = validateNumeric('5', 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 10');
    });

    it('enforces maximum values', () => {
      const result = validateNumeric('15', 0, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at most 10');
    });
  });

  describe('validateUlid', () => {
    it('accepts valid ULIDs', () => {
      const result = validateUlid('01abcdef0123456789abcdef');
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid ULID format', () => {
      const result = validateUlid('invalid-id');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid ID format');
    });

    it('rejects ULIDs that are too short', () => {
      const result = validateUlid('01abcdef0123456789abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid ID format');
    });

    it('rejects ULIDs that are too long', () => {
      const result = validateUlid('01abcdef0123456789abcdefgh');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid ID format');
    });

    it('rejects non-string inputs', () => {
      const result = validateUlid(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('validateJsonData', () => {
    it('accepts valid JSON data', () => {
      const result = validateJsonData({ key: 'value' });
      expect(result.isValid).toBe(true);
    });

    it('rejects excessively large data', () => {
      const largeData = { data: 'x'.repeat(10001) };
      const result = validateJsonData(largeData);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too large');
    });
  });
});

describe('[phase2] RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second for testing
  });

  it('allows initial attempts', () => {
    expect(rateLimiter.isAllowed('user1')).toBe(true);
    expect(rateLimiter.isAllowed('user1')).toBe(true);
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('blocks after max attempts', () => {
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(false);
  });

  it('resets after time window', async () => {
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(false);

    // Wait for window to pass
    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('tracks different users separately', () => {
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(false);
    expect(rateLimiter.isAllowed('user2')).toBe(true);
  });

  it('allows manual reset', () => {
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(false);
    
    rateLimiter.reset('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });
});
