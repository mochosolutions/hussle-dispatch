/**
 * Idempotency store for at-least-once event delivery.
 *
 * The bus records, per consumer group, which message ids it has already
 * processed so a redelivered message becomes a no-op. The key is the
 * event-instance id (`messageId`), never a business key — two distinct events
 * about the same aggregate must each run.
 */
export interface MessageDedupPort {
  wasProcessed(queueGroup: string, messageId: string): Promise<boolean>;
  markProcessed(queueGroup: string, messageId: string): Promise<void>;
}
