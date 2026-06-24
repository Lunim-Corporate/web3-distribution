/**
 * Live ETH Price Fetcher (Server-side)
 *
 * Fetches the current ETH/USD price from CoinGecko's public API.
 * Caches the result for 60 seconds to avoid hammering the API.
 * Falls back to the hardcoded constant if the API is unreachable.
 */

import { ETH_PRICE_USD as FALLBACK_PRICE } from './constants';

interface PriceCache {
  price: number;
  timestamp: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
let cache: PriceCache | null = null;

/**
 * Get the current ETH price in USD.
 * - Uses CoinGecko public API (no API key required)
 * - Caches for 60s to stay within rate limits
 * - Falls back to hardcoded value on failure
 */
export async function getEthPriceUSD(): Promise<number> {
  // Return cached price if still fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.price;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 }, // Next.js ISR cache
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`CoinGecko API returned ${res.status}`);
    }

    const data = await res.json();
    const price = data?.ethereum?.usd;

    if (typeof price !== 'number' || price <= 0) {
      throw new Error('Invalid price data from CoinGecko');
    }

    cache = { price, timestamp: Date.now() };
    return price;
  } catch (err) {
    console.warn('[ethPrice] CoinGecko fetch failed, using fallback:', (err as Error).message);

    // Return stale cache if available (better than fallback)
    if (cache) {
      return cache.price;
    }

    return FALLBACK_PRICE;
  }
}

/**
 * Get the ETH price synchronously (from cache only).
 * Returns the cached value or the fallback if no cache exists.
 * Useful for non-async contexts.
 */
export function getEthPriceCached(): number {
  return cache?.price ?? FALLBACK_PRICE;
}
