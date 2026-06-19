/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 * 
 * Uses a Map of IP → { count, resetAt } entries with automatic cleanup.
 * For production at scale, swap to Redis-backed (e.g. @upstash/ratelimit).
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Separate stores for different tiers
const stores = new Map<string, Map<string, RateLimitEntry>>();

interface RateLimitConfig {
  /** Unique identifier for this rate limit tier */
  tier: 'read' | 'write' | 'auth' | 'sensitive';
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

const TIER_DEFAULTS: Record<RateLimitConfig['tier'], Omit<RateLimitConfig, 'tier'>> = {
  read:      { maxRequests: 120, windowSeconds: 60 },   // 120 reads/min
  write:     { maxRequests: 20,  windowSeconds: 60 },   // 20 writes/min
  auth:      { maxRequests: 10,  windowSeconds: 60 },   // 10 auth attempts/min
  sensitive: { maxRequests: 5,   windowSeconds: 60 },   // 5 sensitive ops/min (distribute, payments)
};

function getStore(tier: string): Map<string, RateLimitEntry> {
  if (!stores.has(tier)) {
    stores.set(tier, new Map());
  }
  return stores.get(tier)!;
}

/**
 * Clean up expired entries every 5 minutes to prevent memory leaks.
 * Only runs when the store exceeds 1000 entries.
 */
function cleanupStore(store: Map<string, RateLimitEntry>) {
  if (store.size < 1000) return;
  const now = Date.now();
  const keysToDelete: string[] = [];
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => store.delete(key));
}

/**
 * Extract client IP from Next.js request headers.
 * Checks x-forwarded-for (reverse proxy), x-real-ip, then falls back.
 */
async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (original client)
    return forwarded.split(',')[0].trim();
  }
  return headerStore.get('x-real-ip') || 'unknown';
}

/**
 * Check rate limit for the current request. Returns null if allowed,
 * or a 429 NextResponse if the limit is exceeded.
 *
 * Usage in API routes:
 *   const blocked = await checkRateLimit('write');
 *   if (blocked) return blocked;
 */
export async function checkRateLimit(
  tier: RateLimitConfig['tier'] = 'read'
): Promise<NextResponse | null> {
  const config = TIER_DEFAULTS[tier];
  const store = getStore(tier);
  const ip = await getClientIp();
  const key = `${tier}:${ip}`;
  const now = Date.now();

  cleanupStore(store);

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — start fresh
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return null;
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests. Please slow down.',
        retryAfterSeconds: retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  // Increment counter
  entry.count += 1;
  store.set(key, entry);
  return null;
}
