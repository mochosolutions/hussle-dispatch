/**
 * Shared EventBus singleton.
 * Uses RabbitMQ in production (or when RABBITMQ_URL is set),
 * falls back to InMemoryEventBus for development and testing.
 */
import type { EventBus } from './eventBus';
import { createInMemoryEventBus } from './inMemoryEventBus';
import { createRabbitMqEventBus } from './rabbitMqEventBus';
import { logger } from '@/shared/utils/logger';

declare global {
  var __eventBus: EventBus | undefined;
}

const createSharedEventBus = (): EventBus => {
  const nodeEnv = process.env['NODE_ENV'];
  const rabbitMqUrl = process.env['RABBITMQ_URL'];

  if (nodeEnv === 'production' || rabbitMqUrl) {
    const url = rabbitMqUrl ?? 'amqp://localhost';
    return createRabbitMqEventBus(url, logger);
  }

  return createInMemoryEventBus();
};

const sharedEventBus: EventBus = (() => {
  if (process.env['NODE_ENV'] === 'production') {
    return createSharedEventBus();
  }

  if (global.__eventBus === undefined) {
    global.__eventBus = createSharedEventBus();
  }

  return global.__eventBus;
})();

export { sharedEventBus };
