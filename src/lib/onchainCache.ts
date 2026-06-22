// Tiny in-memory stale-while-revalidate cache for expensive on-chain reads.
// Lives at module scope, so it survives client-side navigation (home → explore →
// save) but resets on a full reload. Not a persistent cache — just stops the app
// from re-reading every circle from the RPC on every screen change.

type Entry = { data: unknown; ts: number };
const store = new Map<string, Entry>();

export function getCached<T>(key: string, ttlMs: number): { data: T | null; fresh: boolean } {
  const e = store.get(key);
  if (!e) return { data: null, fresh: false };
  return { data: e.data as T, fresh: Date.now() - e.ts < ttlMs };
}

export function setCached(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

/** Invalidate everything, or just keys starting with `prefix`. */
export function clearCached(prefix?: string): void {
  if (!prefix) { store.clear(); return; }
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
