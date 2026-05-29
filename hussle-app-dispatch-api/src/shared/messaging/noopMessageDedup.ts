import type { MessageDedupPort } from './messageDedupPort';

/**
 * No-op dedup for the in-memory bus: publish is synchronous with no redelivery,
 * so there is nothing to deduplicate.
 */
export const createNoopMessageDedup = (): MessageDedupPort => ({
  wasProcessed: async () => false,
  markProcessed: async () => undefined,
});
