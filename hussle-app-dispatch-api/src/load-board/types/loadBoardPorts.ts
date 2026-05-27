import type { FeedMeta, LoadSource, StagedLoad } from './loadBoardTypes';

/**
 * Port for Redis operations used by the load board feature.
 */
export interface LoadBoardRedisPort {
  /**
   * @deprecated Use `addIfAbsent` per-record for ingestion.
   * Atomically replaces all loads for a given source + org combination.
   */
  snapshotReplace(orgId: string, source: LoadSource, loads: StagedLoad[]): Promise<void>;

  /**
   * Atomically inserts a single load only if no load with the same key already
   * exists for the given org/source/sourceId. Returns true when the load was
   * newly added, false when it was already present (deduplication hit).
   */
  addIfAbsent(orgId: string, source: LoadSource, load: StagedLoad): Promise<boolean>;

  /**
   * Returns all loads for an org, optionally filtered by source.
   */
  getAllLoads(orgId: string, source?: LoadSource): Promise<StagedLoad[]>;

  /**
   * Returns a single load by its id, searching across all sources for the org.
   */
  getLoadById(orgId: string, id: string): Promise<StagedLoad | null>;

  /**
   * Deletes all loads for a given source + org combination.
   */
  clearSource(orgId: string, source: LoadSource): Promise<void>;

  /**
   * Returns the feed metadata for an org, or null if not yet set.
   */
  getMeta(orgId: string): Promise<FeedMeta | null>;

  /**
   * Updates the feed metadata for a given source + org combination.
   */
  updateMeta(orgId: string, source: LoadSource, count: number): Promise<void>;
}
