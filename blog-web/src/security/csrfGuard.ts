/**
 * Siteler Arası İstek Sahteciliği (CSRF) Koruması
 */

let csrfToken: string | null = null;

/**
 * Generates a cryptographically strong random token.
 */
function generateRandomToken(): string {
  const array = new Uint8Array(24);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Gets or initializes the dynamic CSRF token.
 */
export function getCsrfToken(): string {
  if (!csrfToken) {
    csrfToken = generateRandomToken();
  }
  return csrfToken;
}

/**
 * Validates the provided token against the session's token.
 */
export function validateCsrfToken(tokenToVerify: string): boolean {
  if (!csrfToken || !tokenToVerify) return false;
  return csrfToken === tokenToVerify;
}

/**
 * Refreshes/rotates the CSRF token.
 */
export function rotateCsrfToken(): string {
  csrfToken = generateRandomToken();
  return csrfToken;
}
