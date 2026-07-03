const inFlightPromises = new Map<string, Promise<any>>();

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export function getCachedData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedData<T>(key: string, data: T, ttlMs: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearCache(): void {
  memoryCache.clear();
  inFlightPromises.clear();
}

export async function getOrSetCachedPromise<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  const cached = getCachedData<T>(key);
  if (cached !== null) return cached;

  return dedupeFetch(key, async () => {
    const data = await fetcher();
    setCachedData(key, data, ttlMs);
    return data;
  });
}

export async function dedupeFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlightPromises.get(key);
  if (existing) return existing;

  const promise = fetcher().finally(() => inFlightPromises.delete(key));
  inFlightPromises.set(key, promise);
  return promise;
}

export function dedupeJsonFetch(
  key: string,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<any> {
  return dedupeFetch(key, async () => {
    const res = await fetch(input, init);
    if (!res.ok) {
      throw new Error(`fetch failed: ${res.status}`);
    }
    return res.json();
  });
}

