/**
 * XSS & Input Sanitization Layer
 */

/**
 * Escapes common HTML special characters to prevent HTML/Script injection.
 */
export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Removes dangerous tags and attributes (e.g., <script>, onload, onerror, javascript:)
 * while keeping safe text characters.
 */
export function sanitizeString(str: string): string {
  if (!str) return '';
  
  // Remove script tags and their content
  let sanitized = str.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  
  // Remove interactive attributes/event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]+/gi, '');
  
  // Remove javascript: and data: pseudo-protocols in links
  sanitized = sanitized.replace(/href\s*=\s*["'](javascript|data):[^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * Validates email structure.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Checks password strength: minimum 8 characters, at least 1 letter and 1 number.
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}
