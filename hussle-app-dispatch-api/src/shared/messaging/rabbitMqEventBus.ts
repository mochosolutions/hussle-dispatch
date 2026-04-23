/**
 * RabbitMQ implementation of EventBus.
 * Uses a topic exchange for routing domain events by name.
 * Handles automatic reconnection on connection loss.
 * Retries failed messages up to 3 times via x-death header tracking.
 *
 * Delayed delivery requires the `rabbitmq_delayed_message_exchange` plugin.
 * See docs/infra-rabbitmq-delayed-messages.md.
 */
import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import amqplib from 'amqplib';

import { ValidationError } from '../errors/commonErrors';
import type { Logger } from '../utils/logger';
import type { EventBus } from './eventBus';
import type { EventMap } from './eventMap';

const EXCHANGE_NAME = 'fleet-command.events';
const EXCHANGE_TYPE = 'topic';
const DELAYED_EXCHANGE_NAME = 'fleet-command.delayed';
const DELAYED_EXCHANGE_TYPE = 'x-delayed-message';
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
 * Typed error thrown when `publishDelayed` is called but the RabbitMQ server
 * does not have the `rabbitmq_delayed_message_exchange` plugin installed.
 */
class DelayedExchangeUnavailableError extends Error {
  readonly code = 'DELAYED_EXCHANGE_UNAVAILABLE';

  constructor() {
    super(
      'Delayed exchange unavailable — rabbitmq_delayed_message_exchange plugin required for publishDelayed',
    );
    Object.setPrototypeOf(this, DelayedExchangeUnavailableError.prototype);
  }
}

/**
 * Type guard for x-death entries with a numeric count field.
 */
const isXDeathWithCount = (value: unknown): value is { count: number } => {
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
  let delayedExchangeAvailable = false;
  const pendingSubscriptions: PendingSubscription[] = [];

  const assertDelayedExchange = async (ch: Channel): Promise<void> => {
    try {
      await ch.assertExchange(DELAYED_EXCHANGE_NAME, DELAYED_EXCHANGE_TYPE, {
        durable: true,
        arguments: { 'x-delayed-type': 'topic' },
      });
      delayedExchangeAvailable = true;
      logger.info('RabbitMQ delayed exchange ready', { exchange: DELAYED_EXCHANGE_NAME });
    } catch (error: unknown) {
      delayedExchangeAvailable = false;
      logger.warn(
        'delayed exchange unavailable — rabbitmq_delayed_message_exchange plugin required for publishDelayed',
        { exchange: DELAYED_EXCHANGE_NAME, error: String(error) },
      );
    }
  };

  const connect = async (): Promise<void> => {
    channelModel = await amqplib.connect(url);
    channel = await channelModel.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
    await assertDelayedExchange(channel);

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
    if (delayedExchangeAvailable) {
      await ch.bindQueue(queueName, DELAYED_EXCHANGE_NAME, event);
    }

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
  ): Promise<void> => {
    const ch = ensureChannel();
    const message = Buffer.from(JSON.stringify(data), 'utf-8');
    ch.publish(EXCHANGE_NAME, String(event), message, {
      persistent: true,
      contentType: 'application/json',
    });
    logger.info('Event published', { event: String(event) });
  };

  /**
   * Publishes a message that is held by the broker for `delayMs` before being
   * routed to the normal queues.
   *
   * Requires the `rabbitmq_delayed_message_exchange` plugin on the RabbitMQ
   * server. If the plugin is missing, assertExchange fails at connect time
   * and this method throws `DelayedExchangeUnavailableError`.
   *
   * Subscribers do NOT need a separate API: `subscribe` binds each queue to
   * both the normal and delayed exchanges using the event name as the routing
   * key, so delayed-then-released messages reach the same handlers as
   * immediate publications.
   */
  const publishDelayed = async <K extends keyof EventMap>(
    event: K,
    data: EventMap[K],
    delayMs: number,
  ): Promise<void> => {
    if (delayMs < 0) {
      throw new ValidationError('delayMs must be >= 0', [`delayMs=${delayMs}`]);
    }
    if (!delayedExchangeAvailable) {
      throw new DelayedExchangeUnavailableError();
    }

    const ch = ensureChannel();
    const message = Buffer.from(JSON.stringify(data), 'utf-8');
    ch.publish(DELAYED_EXCHANGE_NAME, String(event), message, {
      persistent: true,
      contentType: 'application/json',
      headers: { 'x-delay': delayMs },
    });
    logger.info('Delayed event published', { event: String(event), delayMs });
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

  return { publish, publishDelayed, subscribe, close };
};
