import type { FmcsaSnapshot } from './types';

export interface CachePort {
  get(key: string): Promise<FmcsaSnapshot | null>;
  set(key: string, value: FmcsaSnapshot, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}
