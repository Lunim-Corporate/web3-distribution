'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { JsonRpcProvider } from 'ethers';

/**
 * ENS cache stored in sessionStorage to persist across component remounts
 * but clear on tab close. Keyed as `ensCache_<lowercaseAddress>`.
 */
const ENS_CACHE_PREFIX = 'ensCache_';

// Singleton provider for ENS lookups — Ethereum mainnet via Cloudflare's free gateway
let ensProvider: JsonRpcProvider | null = null;
function getEnsProvider(): JsonRpcProvider {
  if (!ensProvider) {
    ensProvider = new JsonRpcProvider('https://cloudflare-eth.com');
  }
  return ensProvider;
}

/**
 * In-memory dedup map to prevent multiple components from firing the same
 * lookup simultaneously (sessionStorage is sync but the RPC is async).
 */
const inflightLookups = new Map<string, Promise<string | null>>();

/**
 * Read the cached ENS name for an address.
 */
function getCachedName(address: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${ENS_CACHE_PREFIX}${address.toLowerCase()}`);
    if (raw === '__null__') return null; // explicitly cached "no ENS"
    return raw;
  } catch {
    return null;
  }
}

/**
 * Write a resolved (or null) ENS name into session cache.
 */
function setCachedName(address: string, name: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      `${ENS_CACHE_PREFIX}${address.toLowerCase()}`,
      name ?? '__null__',
    );
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * useEnsName
 *
 * Resolves a hex Ethereum address to its `.eth` ENS name.
 * Returns `null` while loading or if no ENS name exists.
 *
 * Uses Cloudflare's public Ethereum gateway and caches results in
 * sessionStorage to avoid hammering the RPC on re-renders.
 *
 * @example
 * ```tsx
 * const ensName = useEnsName('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
 * // ensName === 'vitalik.eth'
 * ```
 */
export function useEnsName(address: string | null | undefined): string | null {
  const [ensName, setEnsName] = useState<string | null>(() => {
    if (!address) return null;
    return getCachedName(address);
  });

  // Track the address the effect last resolved to prevent stale sets
  const currentAddress = useRef(address);
  currentAddress.current = address;

  const resolve = useCallback(async (addr: string) => {
    const key = addr.toLowerCase();

    // 1. Check cache first
    const cached = getCachedName(addr);
    if (cached !== null || sessionStorage.getItem(`${ENS_CACHE_PREFIX}${key}`) === '__null__') {
      setEnsName(cached);
      return;
    }

    // 2. Dedup in-flight lookups
    let lookup = inflightLookups.get(key);
    if (!lookup) {
      lookup = (async () => {
        try {
          const provider = getEnsProvider();
          const name = await provider.lookupAddress(addr);
          setCachedName(addr, name);
          return name;
        } catch (err) {
          console.warn('[ENS] Lookup failed for', addr, err);
          setCachedName(addr, null);
          return null;
        } finally {
          inflightLookups.delete(key);
        }
      })();
      inflightLookups.set(key, lookup);
    }

    const resolved = await lookup;
    // Only update state if this is still the active address
    if (currentAddress.current?.toLowerCase() === key) {
      setEnsName(resolved);
    }
  }, []);

  useEffect(() => {
    if (!address || address.length !== 42) {
      setEnsName(null);
      return;
    }
    void resolve(address);
  }, [address, resolve]);

  return ensName;
}

/**
 * Utility: format an address for display.
 * If an ENS name is available, returns it; otherwise returns a truncated hex.
 */
export function formatAddress(address: string, ensName?: string | null): string {
  if (ensName) return ensName;
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
