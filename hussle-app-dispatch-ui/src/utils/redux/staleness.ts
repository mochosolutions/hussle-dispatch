export const STALE_TTL_MS = 60_000;

export const isStale = (lastFetchedAt: number | null, ttl = STALE_TTL_MS): boolean =>
  !lastFetchedAt || Date.now() - lastFetchedAt > ttl;
