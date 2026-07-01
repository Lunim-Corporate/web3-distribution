const inFlightPromises = new Map<string, Promise<any>>();

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
