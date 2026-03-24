/**
 * EventBus abstraction for publishing and subscribing to domain events.
 * Implementations: RabbitMqEventBus (production), InMemoryEventBus (tests).
 */
import type { EventMap } from './eventMap';

export interface PublishOptions {
  delay?: number; // ms — deferred delivery (not yet implemented)
}

export interface EventBus {
  publish<K extends keyof EventMap>(
    event: K,
    data: EventMap[K],
    options?: PublishOptions,
  ): Promise<void>;
  subscribe<K extends keyof EventMap>(
    event: K,
    queueGroup: string,
    handler: (data: EventMap[K]) => Promise<void>,
  ): Promise<void>;
  close(): Promise<void>;
}
