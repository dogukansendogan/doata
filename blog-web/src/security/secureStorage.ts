/**
 * Secure Storage & Session Handling Layer
 */

// Simple XOR encoding key
const STORAGE_SALT = 'doata_secure_salt_2026';

function xorEncode(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ STORAGE_SALT.charCodeAt(i % STORAGE_SALT.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

function xorDecode(encoded: string): string {
  try {
    const raw = decodeURIComponent(escape(atob(encoded)));
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ STORAGE_SALT.charCodeAt(i % STORAGE_SALT.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return '';
  }
}

export const secureStorage = {
  /**
   * Sets encrypted data in localStorage.
   */
  setItem(key: string, value: any): void {
    const stringified = JSON.stringify(value);
    const encrypted = xorEncode(stringified);
    localStorage.setItem(key, encrypted);
  },

  /**
   * Gets and decrypts data from localStorage.
   */
  getItem<T = any>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const decrypted = xorDecode(item);
    if (!decrypted) return null;
    try {
      return JSON.parse(decrypted) as T;
    } catch (e) {
      return null;
    }
  },

  /**
   * Removes item from localStorage.
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clears storage.
   */
  clear(): void {
    localStorage.clear();
  }
};

/**
 * Tracks user activity and logs out if inactive for set time (default 15 minutes).
 */
export function initSessionTimeout(onTimeout: () => void, timeoutMs = 15 * 60 * 1000) {
  let timeoutId: number;

  const resetTimer = () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  };

  // Listen for user interactions
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    window.addEventListener(event, resetTimer, { passive: true });
  });

  resetTimer();

  return () => {
    window.clearTimeout(timeoutId);
    events.forEach(event => {
      window.removeEventListener(event, resetTimer);
    });
  };
}
