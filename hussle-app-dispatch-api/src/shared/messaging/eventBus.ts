/**
 * EventBus abstraction for publishing and subscribing to domain events.
 * Implementations: RabbitMqEventBus (production), InMemoryEventBus (tests).
 */

export type DomainEventName =
  | 'load.status.changed'
  | 'load.delivered'
  | 'load.canceled'
  | 'load.tonu';

export interface DomainEvent {
  readonly name: DomainEventName;
  readonly occurredAt: Date;
  readonly correlationId?: string;
  readonly payload: Record<string, unknown>;
}

export type EventHandler = (payload: unknown) => Promise<void>;

export interface EventBus {
  publish(event: string, payload: unknown): Promise<void>;
  subscribe(event: string, handler: EventHandler): Promise<void>;
  close(): Promise<void>;
}
