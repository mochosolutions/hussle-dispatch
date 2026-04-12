import type { FeedMeta, LoadSource, StagedLoad } from './loadBoardTypes';

/**
 * Port for Redis operations used by the load board feature.
 */
export interface LoadBoardRedisPort {
  /**
   * Atomically replaces all loads for a given source + org combination.
   */
  snapshotReplace(orgId: string, source: LoadSource, loads: StagedLoad[]): Promise<void>;

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
