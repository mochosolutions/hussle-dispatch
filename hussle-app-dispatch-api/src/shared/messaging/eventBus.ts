/**
 * EventBus abstraction for publishing and subscribing to domain events.
 * Implementations: RabbitMqEventBus (production), InMemoryEventBus (tests).
 */
import type { EventMap } from './eventMap';

export interface EventBus {
  publish<K extends keyof EventMap>(event: K, data: EventMap[K]): Promise<void>;
  /**
   * Publishes a message that is held by the broker and delivered after `delayMs`
   * milliseconds have elapsed. Subscribers bound via `subscribe` will receive
   * delayed messages through the same handler as immediate ones.
   */
  publishDelayed<K extends keyof EventMap>(
    event: K,
    data: EventMap[K],
    delayMs: number,
  ): Promise<void>;
  subscribe<K extends keyof EventMap>(
    event: K,
    queueGroup: string,
    handler: (data: EventMap[K]) => Promise<void>,
  ): Promise<void>;
  close(): Promise<void>;
}
