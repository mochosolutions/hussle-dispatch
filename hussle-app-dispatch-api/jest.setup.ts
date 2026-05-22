jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

jest.mock('@/shared/messaging/sharedEventBus', () => {
  const { createInMemoryEventBus } = jest.requireActual('@/shared/messaging/inMemoryEventBus');
  return { sharedEventBus: createInMemoryEventBus() };
});

afterEach(() => {
  jest.useRealTimers();
});
