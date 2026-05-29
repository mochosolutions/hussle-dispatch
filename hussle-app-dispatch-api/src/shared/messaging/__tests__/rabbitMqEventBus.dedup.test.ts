import { EventEmitter } from 'events';

import type { MessageDedupPort } from '../messageDedupPort';

jest.mock('amqplib', () => ({
  __esModule: true,
  default: { connect: jest.fn() },
}));

import amqplib from 'amqplib';

import { createRabbitMqEventBus } from '../rabbitMqEventBus';

interface FakeMsg {
  content: Buffer;
  properties: {
    messageId?: string;
    contentType?: string;
    headers?: Record<string, unknown>;
  };
}

const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

const noopLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const makeMsg = (
  messageId: string | undefined,
  payload: object,
  headers: Record<string, unknown> = {},
): FakeMsg => ({
  content: Buffer.from(JSON.stringify(payload), 'utf-8'),
  properties: { messageId, contentType: 'application/json', headers },
});

describe('rabbitMqEventBus dedup', () => {
  const QUEUE_GROUP = 'test-group';
  const EVENT = 'load.delivered';
  const queueName = `fleet-command.${QUEUE_GROUP}.${EVENT}`;

  let consumeCallbacks: Map<string, (msg: FakeMsg) => void>;
  let publishCalls: { exchange: string; routingKey: string; options: Record<string, unknown> }[];
  let ackCalls: FakeMsg[];
  let channel: Record<string, jest.Mock>;
  let seen: Set<string>;
  let dedup: MessageDedupPort & { wasProcessed: jest.Mock; markProcessed: jest.Mock };

  const subscribeHandler = async (
    handler: (data: unknown) => Promise<void>,
  ): Promise<(msg: FakeMsg) => void> => {
    const bus = createRabbitMqEventBus('amqp://test', noopLogger, dedup);
    await bus.subscribe(EVENT, QUEUE_GROUP, handler as never);
    await flush();
    const cb = consumeCallbacks.get(queueName);
    if (!cb) {
      throw new Error('consume callback not registered');
    }
    return cb;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumeCallbacks = new Map();
    publishCalls = [];
    ackCalls = [];
    seen = new Set();

    dedup = {
      wasProcessed: jest.fn(async (group: string, id: string) => seen.has(`${group}:${id}`)),
      markProcessed: jest.fn(async (group: string, id: string) => {
        seen.add(`${group}:${id}`);
      }),
    };

    channel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn((queue: string, cb: (msg: FakeMsg) => void) => {
        consumeCallbacks.set(queue, cb);
        return Promise.resolve();
      }),
      publish: jest.fn((...args: unknown[]) => {
        const [exchange, routingKey, , options] = args as [
          string,
          string,
          Buffer,
          Record<string, unknown>,
        ];
        publishCalls.push({ exchange, routingKey, options });
        return true;
      }),
      ack: jest.fn((msg: FakeMsg) => ackCalls.push(msg)),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    const channelModel = Object.assign(new EventEmitter(), {
      createChannel: jest.fn().mockResolvedValue(channel),
      close: jest.fn().mockResolvedValue(undefined),
    });

    (amqplib.connect as jest.Mock).mockResolvedValue(channelModel);
  });

  it('runs the handler and records the message on first delivery', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const cb = await subscribeHandler(handler);

    cb(makeMsg('msg-1', { loadId: 'l1', organizationId: 'o1', status: 'DELIVERED' }));
    await flush();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(dedup.markProcessed).toHaveBeenCalledWith(QUEUE_GROUP, 'msg-1');
    expect(ackCalls).toHaveLength(1);
  });

  it('skips the handler when the same messageId is delivered again', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const cb = await subscribeHandler(handler);

    const msg = makeMsg('msg-1', { loadId: 'l1', organizationId: 'o1', status: 'DELIVERED' });
    cb(msg);
    await flush();
    cb(msg);
    await flush();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(ackCalls).toHaveLength(2);
  });

  it('preserves the messageId on retry and does not record a failed message', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('boom'));
    const cb = await subscribeHandler(handler);

    cb(makeMsg('msg-1', { loadId: 'l1', organizationId: 'o1', status: 'DELIVERED' }));
    await flush();

    const retry = publishCalls.find((p) => p.routingKey === EVENT);
    expect(retry).toBeDefined();
    expect(retry?.options.messageId).toBe('msg-1');
    expect(dedup.markProcessed).not.toHaveBeenCalled();
  });

  it('runs the handler when no messageId is present (no dedup)', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const cb = await subscribeHandler(handler);

    cb(makeMsg(undefined, { loadId: 'l1', organizationId: 'o1', status: 'DELIVERED' }));
    await flush();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(dedup.wasProcessed).not.toHaveBeenCalled();
    expect(dedup.markProcessed).not.toHaveBeenCalled();
    expect(ackCalls).toHaveLength(1);
  });

  it('fails open and runs the handler when the dedup store errors', async () => {
    dedup.wasProcessed.mockRejectedValueOnce(new Error('redis down'));
    const handler = jest.fn().mockResolvedValue(undefined);
    const cb = await subscribeHandler(handler);

    cb(makeMsg('msg-1', { loadId: 'l1', organizationId: 'o1', status: 'DELIVERED' }));
    await flush();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(ackCalls).toHaveLength(1);
  });
});
