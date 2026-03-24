/**
 * RabbitMQ implementation of EventBus.
 * Uses a topic exchange for routing domain events by name.
 * Handles automatic reconnection on connection loss.
 * Retries failed messages up to 3 times via x-death header tracking.
 */
import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import amqplib from 'amqplib';

import type { Logger } from '../utils/logger';
import type { EventBus, PublishOptions } from './eventBus';
import type { EventMap } from './eventMap';

const EXCHANGE_NAME = 'fleet-command.events';
const EXCHANGE_TYPE = 'topic';
const RECONNECT_DELAY_MS = 5000;
const MAX_RETRIES = 3;

interface PendingSubscription {
  event: string;
  queueGroup: string;
  handler: (data: unknown) => Promise<void>;
}

/**
 * Typed error for when the EventBus channel is not available.
 */
class EventBusNotConnectedError extends Error {
  readonly code = 'EVENT_BUS_NOT_CONNECTED';

  constructor() {
    super('EventBus is not connected to RabbitMQ');
    Object.setPrototypeOf(this, EventBusNotConnectedError.prototype);
  }
}

/**
 * Typed error for unsupported publish options.
 */
class DelayedPublishNotSupportedError extends Error {
  readonly code = 'DELAYED_PUBLISH_NOT_SUPPORTED';

  constructor() {
    super('Delayed publishing is not yet supported by RabbitMQ EventBus');
    Object.setPrototypeOf(this, DelayedPublishNotSupportedError.prototype);
  }
}

/**
 * Type guard for x-death entries with a numeric count field.
 */
const isXDeathWithCount = (
  value: unknown,
): value is { count: number } => {
  if (typeof value !== 'object' || value === null || !('count' in value)) {
    return false;
  }
  return typeof value.count === 'number';
};

/**
 * Extracts the retry count from a message's x-death header.
 * Returns 0 if the header is absent or malformed.
 */
const getRetryCount = (msg: ConsumeMessage): number => {
  const headers = msg.properties.headers;
  if (!headers) {
    return 0;
  }

  const xDeath = headers['x-death'];
  if (!Array.isArray(xDeath) || xDeath.length === 0) {
    return 0;
  }

  const firstEntry: unknown = xDeath[0];
  if (isXDeathWithCount(firstEntry)) {
    return firstEntry.count;
  }

  return 0;
};

export const createRabbitMqEventBus = (url: string, logger: Logger): EventBus => {
  let channelModel: ChannelModel | null = null;
  let channel: Channel | null = null;
  let closing = false;
  const pendingSubscriptions: PendingSubscription[] = [];

  const connect = async (): Promise<void> => {
    channelModel = await amqplib.connect(url);
    channel = await channelModel.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

    channelModel.on('error', (error: unknown) => {
      logger.error('RabbitMQ connection error', { error: String(error) });
    });

    channelModel.on('close', () => {
      if (!closing) {
        logger.warn('RabbitMQ connection closed unexpectedly, reconnecting...');
        scheduleReconnect();
      }
    });

    logger.info('RabbitMQ connected', { exchange: EXCHANGE_NAME });

    // Re-register pending subscriptions after reconnect
    const subscriptionsToRestore = [...pendingSubscriptions];
    for (const sub of subscriptionsToRestore) {
      await bindAndConsume(sub.event, sub.queueGroup, sub.handler);
    }
  };

  const scheduleReconnect = (): void => {
    setTimeout(() => {
      connect().catch((error: unknown) => {
        logger.error('RabbitMQ reconnect failed, retrying...', { error: String(error) });
        scheduleReconnect();
      });
    }, RECONNECT_DELAY_MS);
  };

  const ensureChannel = (): Channel => {
    if (!channel) {
      throw new EventBusNotConnectedError();
    }
    return channel;
  };

  const bindAndConsume = async (
    event: string,
    queueGroup: string,
    handler: (data: unknown) => Promise<void>,
  ): Promise<void> => {
    const ch = ensureChannel();
    const queueName = `fleet-command.${queueGroup}.${event}`;
    await ch.assertQueue(queueName, { durable: true });
    await ch.bindQueue(queueName, EXCHANGE_NAME, event);

    await ch.consume(queueName, (msg) => {
      if (!msg) {
        return;
      }

      const content = msg.content.toString('utf-8');

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        logger.error('Failed to parse message payload', { event, content });
        ch.nack(msg, false, false);
        return;
      }

      handler(parsed)
        .then(() => {
          ch.ack(msg);
        })
        .catch((error: unknown) => {
          const retryCount = getRetryCount(msg);

          if (retryCount < MAX_RETRIES) {
            logger.warn('Event handler failed, requeueing for retry', {
              event,
              retryCount: retryCount + 1,
              maxRetries: MAX_RETRIES,
              error: String(error),
            });
            ch.nack(msg, false, true);
          } else {
            logger.error('Event handler failed after max retries, discarding message', {
              event,
              retryCount,
              maxRetries: MAX_RETRIES,
              error: String(error),
              payload: content,
            });
            ch.nack(msg, false, false);
          }
        });
    });
  };

  const publish = async <K extends keyof EventMap>(
    event: K,
    data: EventMap[K],
    options?: PublishOptions,
  ): Promise<void> => {
    if (options?.delay !== undefined) {
      throw new DelayedPublishNotSupportedError();
    }

    const ch = ensureChannel();
    const message = Buffer.from(JSON.stringify(data), 'utf-8');
    ch.publish(EXCHANGE_NAME, String(event), message, {
      persistent: true,
      contentType: 'application/json',
    });
    logger.info('Event published', { event: String(event) });
  };

  const subscribe = async <K extends keyof EventMap>(
    event: K,
    queueGroup: string,
    handler: (data: EventMap[K]) => Promise<void>,
  ): Promise<void> => {
    // Wrap the typed handler to accept unknown — the contract guarantees
    // the payload shape matches EventMap[K] at publish time.
    const wrappedHandler = (data: unknown): Promise<void> => handler(data as EventMap[K]);
    pendingSubscriptions.push({
      event: String(event),
      queueGroup,
      handler: wrappedHandler,
    });
    if (channel) {
      await bindAndConsume(String(event), queueGroup, wrappedHandler);
    }
  };

  const close = async (): Promise<void> => {
    closing = true;
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (channelModel) {
      await channelModel.close();
      channelModel = null;
    }
    logger.info('RabbitMQ connection closed');
  };

  // Initiate connection immediately
  connect().catch((error: unknown) => {
    logger.error('RabbitMQ initial connection failed, will retry...', { error: String(error) });
    scheduleReconnect();
  });

  return { publish, subscribe, close };
};
