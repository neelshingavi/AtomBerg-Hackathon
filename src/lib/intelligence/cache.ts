const store = new Map<string, { data: unknown; expires: number }>();
const TTL_MS = 60_000;

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs = TTL_MS): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
