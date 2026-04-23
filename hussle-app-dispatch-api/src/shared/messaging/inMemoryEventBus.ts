/**
 * In-memory EventBus implementation for testing.
 * Publish is synchronous (awaited) for deterministic test assertions.
 * publishDelayed uses setTimeout and tracks pending timer handles so tests
 * can clear them via close() / clear().
 */
import type { EventBus } from './eventBus';
import type { EventMap } from './eventMap';

type AnyHandler = (data: unknown) => Promise<void>;

/**
 * Thrown by the in-memory bus when `publishDelayed` receives a negative delay.
 */
class InvalidDelayError extends Error {
  readonly code = 'INVALID_DELAY';

  constructor(delayMs: number) {
    super(`delayMs must be >= 0 (got ${delayMs})`);
    Object.setPrototypeOf(this, InvalidDelayError.prototype);
  }
}

export const createInMemoryEventBus = (): EventBus & {
  getHandlers(event: keyof EventMap): AnyHandler[];
  getPendingDelays(): number;
  clear(): void;
} => {
  const handlers = new Map<string, AnyHandler[]>();
  const timers = new Set<NodeJS.Timeout>();

  const publish = async <K extends keyof EventMap>(
    event: K,
    data: EventMap[K],
  ): Promise<void> => {
    const eventHandlers = handlers.get(event) ?? [];
    for (const handler of eventHandlers) {
      await handler(data);
    }
  };

  const publishDelayed = async <K extends keyof EventMap>(
    event: K,
    data: EventMap[K],
    delayMs: number,
  ): Promise<void> => {
    if (delayMs < 0) {
      throw new InvalidDelayError(delayMs);
    }

    if (delayMs <= 0) {
      await publish(event, data);
      return;
    }

    const timer = setTimeout(() => {
      timers.delete(timer);
      publish(event, data).catch(() => {
        // Swallow errors — in-memory bus has no broker to ack/nack against.
        // Handlers are responsible for their own error handling.
      });
    }, delayMs);
    timers.add(timer);
  };

  const subscribe = async <K extends keyof EventMap>(
    event: K,
    _queueGroup: string,
    handler: (data: EventMap[K]) => Promise<void>,
  ): Promise<void> => {
    // Wrap the typed handler to accept unknown — the contract guarantees
    // the payload shape matches EventMap[K] at publish time.
    const wrappedHandler: AnyHandler = (data) => handler(data as EventMap[K]);
    const existing = handlers.get(event) ?? [];
    existing.push(wrappedHandler);
    handlers.set(event, existing);
  };

  const clearTimers = (): void => {
    for (const timer of timers) {
      clearTimeout(timer);
    }
    timers.clear();
  };

  const close = async (): Promise<void> => {
    clearTimers();
    handlers.clear();
  };

  const getHandlers = (event: keyof EventMap): AnyHandler[] => handlers.get(event) ?? [];

  const getPendingDelays = (): number => timers.size;

  const clear = (): void => {
    clearTimers();
    handlers.clear();
  };

  return { publish, publishDelayed, subscribe, close, getHandlers, getPendingDelays, clear };
};
