/**
 * In-memory EventBus implementation for testing.
 * Publish is synchronous (awaited) for deterministic test assertions.
 */
import type { EventBus, EventHandler } from './eventBus';

export const createInMemoryEventBus = (): EventBus & {
  getHandlers(event: string): EventHandler[];
  clear(): void;
} => {
  const handlers = new Map<string, EventHandler[]>();

  const publish = async (event: string, payload: unknown): Promise<void> => {
    const eventHandlers = handlers.get(event) ?? [];
    for (const handler of eventHandlers) {
      await handler(payload);
    }
  };

  const subscribe = async (event: string, handler: EventHandler): Promise<void> => {
    const existing = handlers.get(event) ?? [];
    existing.push(handler);
    handlers.set(event, existing);
  };

  const close = async (): Promise<void> => {
    handlers.clear();
  };

  const getHandlers = (event: string): EventHandler[] => handlers.get(event) ?? [];

  const clear = (): void => {
    handlers.clear();
  };

  return { publish, subscribe, close, getHandlers, clear };
};
