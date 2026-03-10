/**
 * RabbitMQ implementation of EventBus.
 * Uses a topic exchange for routing domain events by name.
 * Handles automatic reconnection on connection loss.
 */
import type { Channel, ChannelModel } from 'amqplib';
import amqplib from 'amqplib';

import type { Logger } from '../utils/logger';
import type { EventBus, EventHandler } from './eventBus';

const EXCHANGE_NAME = 'fleet-command.events';
const EXCHANGE_TYPE = 'topic';
const RECONNECT_DELAY_MS = 5000;

interface PendingSubscription {
  event: string;
  handler: EventHandler;
}

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
      await bindAndConsume(sub.event, sub.handler);
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

  const bindAndConsume = async (event: string, handler: EventHandler): Promise<void> => {
    const ch = ensureChannel();
    const queueName = `fleet-command.${event}`;
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
          logger.error('Event handler failed', { event, error: String(error) });
          ch.nack(msg, false, false);
        });
    });
  };

  const publish = async (event: string, payload: unknown): Promise<void> => {
    const ch = ensureChannel();
    const message = Buffer.from(JSON.stringify(payload), 'utf-8');
    ch.publish(EXCHANGE_NAME, event, message, {
      persistent: true,
      contentType: 'application/json',
    });
    logger.info('Event published', { event });
  };

  const subscribe = async (event: string, handler: EventHandler): Promise<void> => {
    pendingSubscriptions.push({ event, handler });
    await bindAndConsume(event, handler);
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
