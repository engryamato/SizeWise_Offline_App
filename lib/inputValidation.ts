'use client';

// Input validation and sanitization utilities for security

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

// Maximum lengths for different input types
export const INPUT_LIMITS = {
  PROJECT_NAME: 100,
  PROJECT_DESCRIPTION: 500,
  PIN_MIN: 6,
  PIN_MAX: 10,
  GENERAL_TEXT: 255,
} as const;

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers with quotes
    .replace(/on\w+\s*=\s*[^"'\s>]+/gi, '') // Remove event handlers without quotes
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
}

// Validate and sanitize project name
export function validateProjectName(name: string): ValidationResult {
  if (typeof name !== 'string') {
    return { isValid: false, error: 'Project name must be a string' };
  }

  const trimmed = name.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Project name is required' };
  }
  
  if (trimmed.length > INPUT_LIMITS.PROJECT_NAME) {
    return { 
      isValid: false, 
      error: `Project name must be ${INPUT_LIMITS.PROJECT_NAME} characters or less` 
    };
  }

  // Check for potentially dangerous characters
  if (/[<>'"&;:]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Project name contains invalid characters'
    };
  }

  const sanitized = sanitizeHtml(trimmed);
  return { isValid: true, sanitized };
}

// Validate and sanitize project description
export function validateProjectDescription(description: string): ValidationResult {
  if (typeof description !== 'string') {
    return { isValid: false, error: 'Description must be a string' };
  }

  const trimmed = description.trim();

  if (trimmed.length > INPUT_LIMITS.PROJECT_DESCRIPTION) {
    return {
      isValid: false,
      error: `Description must be ${INPUT_LIMITS.PROJECT_DESCRIPTION} characters or less`
    };
  }

  // Check for potentially dangerous characters (same as project name)
  if (/[<>'"&;:]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Description contains invalid characters'
    };
  }

  const sanitized = sanitizeHtml(trimmed);
  return { isValid: true, sanitized };
}

// Validate PIN format
export function validatePin(pin: string): ValidationResult {
  if (typeof pin !== 'string') {
    return { isValid: false, error: 'PIN must be a string' };
  }

  // Remove any non-numeric characters
  const numericOnly = pin.replace(/\D/g, '');
  
  if (numericOnly.length < INPUT_LIMITS.PIN_MIN) {
    return { 
      isValid: false, 
      error: `PIN must be at least ${INPUT_LIMITS.PIN_MIN} digits` 
    };
  }
  
  if (numericOnly.length > INPUT_LIMITS.PIN_MAX) {
    return { 
      isValid: false, 
      error: `PIN must be ${INPUT_LIMITS.PIN_MAX} digits or less` 
    };
  }

  return { isValid: true, sanitized: numericOnly };
}

// Validate category selection
export function validateCategory(category: string): ValidationResult {
  const validCategories = ['residential', 'commercial', 'industrial'];
  
  if (!validCategories.includes(category)) {
    return { 
      isValid: false, 
      error: 'Invalid category selection' 
    };
  }

  return { isValid: true, sanitized: category };
}

// Validate unit system selection
export function validateUnitSystem(unitSystem: string): ValidationResult {
  const validUnits = ['imperial', 'si'];
  
  if (!validUnits.includes(unitSystem)) {
    return { 
      isValid: false, 
      error: 'Invalid unit system selection' 
    };
  }

  return { isValid: true, sanitized: unitSystem };
}

// Validate numeric inputs
export function validateNumeric(value: string | number, min?: number, max?: number): ValidationResult {
  // Handle string inputs
  if (typeof value === 'string') {
    // Reject string representations of special values
    const lowerValue = value.toLowerCase().trim();
    if (['nan', 'infinity', '-infinity', 'undefined', 'null'].includes(lowerValue)) {
      return { isValid: false, error: 'Value must be a valid number' };
    }
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: 'Value must be a valid number' };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `Value must be at most ${max}` };
  }

  return { isValid: true, sanitized: num.toString() };
}

// Validate ULID format (custom 24-character format used in this app)
export function validateUlid(id: string): ValidationResult {
  if (typeof id !== 'string') {
    return { isValid: false, error: 'ID must be a string' };
  }

  // Custom ULID format: 24 characters, base36 encoded (0-9, a-z)
  const ulidPattern = /^[0-9a-z]{24}$/i;

  if (!ulidPattern.test(id)) {
    return { isValid: false, error: 'Invalid ID format' };
  }

  return { isValid: true, sanitized: id.toLowerCase() };
}

// General text validation with length limit
export function validateGeneralText(text: string, maxLength: number = INPUT_LIMITS.GENERAL_TEXT): ValidationResult {
  if (typeof text !== 'string') {
    return { isValid: false, error: 'Text must be a string' };
  }

  const trimmed = text.trim();
  
  if (trimmed.length > maxLength) {
    return { 
      isValid: false, 
      error: `Text must be ${maxLength} characters or less` 
    };
  }

  const sanitized = sanitizeHtml(trimmed);
  return { isValid: true, sanitized };
}

// Validate JSON data
export function validateJsonData(data: any): ValidationResult {
  try {
    const jsonString = JSON.stringify(data);
    
    // Prevent excessively large JSON
    if (jsonString.length > 10000) {
      return { isValid: false, error: 'Data too large' };
    }

    return { isValid: true, sanitized: jsonString };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON data' };
  }
}

// Rate limiting helper for authentication attempts
export class RateLimiter {
  private attempts = new Map<string, { count: number; lastAttempt: number }>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= this.maxAttempts) {
      return false;
    }

    // Increment count
    record.count++;
    record.lastAttempt = now;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
