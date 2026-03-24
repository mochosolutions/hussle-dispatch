/**
 * In-memory EventBus implementation for testing.
 * Publish is synchronous (awaited) for deterministic test assertions.
 */
import type { EventMap } from './eventMap';
import type { EventBus, PublishOptions } from './eventBus';

type AnyHandler = (data: unknown) => Promise<void>;

export const createInMemoryEventBus = (): EventBus & {
  getHandlers(event: keyof EventMap): AnyHandler[];
  clear(): void;
} => {
  const handlers = new Map<string, AnyHandler[]>();

  const publish = async <K extends keyof EventMap>(
    event: K,
    data: EventMap[K],
    options?: PublishOptions,
  ): Promise<void> => {
    if (options?.delay !== undefined) {
      throw new Error('Delayed messages not yet implemented');
    }

    const eventHandlers = handlers.get(event) ?? [];
    for (const handler of eventHandlers) {
      await handler(data);
    }
  };

  const subscribe = async <K extends keyof EventMap>(
    event: K,
    _queueGroup: string,
    handler: (data: EventMap[K]) => Promise<void>,
  ): Promise<void> => {
    const existing = handlers.get(event) ?? [];
    existing.push(handler as AnyHandler);
    handlers.set(event, existing);
  };

  const close = async (): Promise<void> => {
    handlers.clear();
  };

  const getHandlers = (event: keyof EventMap): AnyHandler[] =>
    handlers.get(event) ?? [];

  const clear = (): void => {
    handlers.clear();
  };

  return { publish, subscribe, close, getHandlers, clear };
};
