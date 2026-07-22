/**
 * Client-Side Rate Limiter and Bot/Spam Protection Layer
 */

interface RateLimitTracker {
  timestamps: number[];
}

const activeLimits: Record<string, RateLimitTracker> = {};

/**
 * Checks if a specific action has exceeded the rate limit.
 * @param action - Unique identifier for the action (e.g., 'login', 'comment')
 * @param limit - Maximum allowed actions within the timeframe
 * @param windowMs - Time window in milliseconds (e.g., 60000 for 1 minute)
 * @returns boolean - true if the action is rate limited, false otherwise
 */
export function isRateLimited(action: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  
  if (!activeLimits[action]) {
    activeLimits[action] = { timestamps: [now] };
    return false;
  }

  const tracker = activeLimits[action];
  
  // Filter out timestamps older than the window
  tracker.timestamps = tracker.timestamps.filter(time => now - time < windowMs);

  if (tracker.timestamps.length >= limit) {
    return true;
  }

  tracker.timestamps.push(now);
  return false;
}

/**
 * Returns remaining cooldown time in seconds for a limited action.
 */
export function getRemainingCooldown(action: string, windowMs: number): number {
  const tracker = activeLimits[action];
  if (!tracker || tracker.timestamps.length === 0) return 0;
  
  const now = Date.now();
  const oldestTimestamp = tracker.timestamps[0];
  const elapsed = now - oldestTimestamp;
  const remaining = Math.max(0, Math.ceil((windowMs - elapsed) / 1000));
  return remaining;
}
