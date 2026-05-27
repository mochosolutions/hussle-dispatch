import { createInMemoryEventBus } from '../inMemoryEventBus';

describe('createInMemoryEventBus', () => {
  describe('publish', () => {
    it('fires handlers synchronously within await', async () => {
      // Arrange
      const bus = createInMemoryEventBus();
      const handler = jest.fn(async () => {
        // no-op handler
      });
      await bus.subscribe('sms.prompt.canceled', 'group', handler);

      // Act
      await bus.publish('sms.prompt.canceled', {
        smsPromptScheduleId: 'sched-1',
        loadId: 'load-1',
        reason: 'test',
      });

      // Assert
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        smsPromptScheduleId: 'sched-1',
        loadId: 'load-1',
        reason: 'test',
      });

      await bus.close();
    });

    it('fires multiple handlers for the same event in subscription order', async () => {
      // Arrange
      const bus = createInMemoryEventBus();
      const calls: string[] = [];
      await bus.subscribe('sms.prompt.canceled', 'group-a', async () => {
        calls.push('a');
      });
      await bus.subscribe('sms.prompt.canceled', 'group-b', async () => {
        calls.push('b');
      });

      // Act
      await bus.publish('sms.prompt.canceled', {
        smsPromptScheduleId: 'sched-1',
        loadId: 'load-1',
        reason: 'test',
      });

      // Assert
      expect(calls).toEqual(['a', 'b']);

      await bus.close();
    });
  });

  describe('publishDelayed', () => {
    it('fires handler synchronously when delayMs is 0', async () => {
      // Arrange
      const bus = createInMemoryEventBus();
      const handler = jest.fn(async () => {
        // no-op handler
      });
      await bus.subscribe('sms.prompt.canceled', 'group', handler);

      // Act
      await bus.publishDelayed(
        'sms.prompt.canceled',
        { smsPromptScheduleId: 'sched-1', loadId: 'load-1', reason: 'test' },
        0,
      );

      // Assert
      expect(handler).toHaveBeenCalledTimes(1);
      expect(bus.getPendingDelays()).toBe(0);

      await bus.close();
    });

    it('does not fire handler immediately when delayMs is positive', async () => {
      // Arrange
      jest.useFakeTimers();
      const bus = createInMemoryEventBus();
      const handler = jest.fn(async () => {
        // no-op handler
      });
      await bus.subscribe('sms.prompt.canceled', 'group', handler);

      // Act
      await bus.publishDelayed(
        'sms.prompt.canceled',
        { smsPromptScheduleId: 'sched-1', loadId: 'load-1', reason: 'test' },
        5000,
      );

      // Assert — handler has not fired yet
      expect(handler).not.toHaveBeenCalled();
      expect(bus.getPendingDelays()).toBe(1);

      // Advance time past the delay
      jest.advanceTimersByTime(5000);
      // Let the queued microtask from setTimeout's callback complete
      await Promise.resolve();
      await Promise.resolve();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(bus.getPendingDelays()).toBe(0);

      await bus.close();
      jest.useRealTimers();
    });

    it('rejects with InvalidDelayError on negative delay', async () => {
      // Arrange
      const bus = createInMemoryEventBus();

      // Act + Assert
      await expect(
        bus.publishDelayed(
          'sms.prompt.canceled',
          { smsPromptScheduleId: 'sched-1', loadId: 'load-1', reason: 'test' },
          -1,
        ),
      ).rejects.toThrow('delayMs must be >= 0');

      await bus.close();
    });

    it('tracks multiple pending delays', async () => {
      // Arrange
      jest.useFakeTimers();
      const bus = createInMemoryEventBus();
      const handler = jest.fn(async () => {
        // no-op handler
      });
      await bus.subscribe('sms.prompt.canceled', 'group', handler);

      // Act
      await bus.publishDelayed(
        'sms.prompt.canceled',
        { smsPromptScheduleId: 'sched-1', loadId: 'load-1', reason: 't1' },
        1000,
      );
      await bus.publishDelayed(
        'sms.prompt.canceled',
        { smsPromptScheduleId: 'sched-2', loadId: 'load-2', reason: 't2' },
        2000,
      );
      await bus.publishDelayed(
        'sms.prompt.canceled',
        { smsPromptScheduleId: 'sched-3', loadId: 'load-3', reason: 't3' },
        3000,
      );

      // Assert
      expect(bus.getPendingDelays()).toBe(3);

      await bus.close();
      jest.useRealTimers();
    });
  });

  describe('close', () => {
    it('clears pending delay timers', async () => {
      // Arrange
      jest.useFakeTimers();
      const bus = createInMemoryEventBus();
      const handler = jest.fn(async () => {
        // no-op handler
      });
      await bus.subscribe('sms.prompt.canceled', 'group', handler);
      await bus.publishDelayed(
        'sms.prompt.canceled',
        { smsPromptScheduleId: 'sched-1', loadId: 'load-1', reason: 't' },
        10000,
      );
      expect(bus.getPendingDelays()).toBe(1);

      // Act
      await bus.close();

      // Assert — timers cleared
      expect(bus.getPendingDelays()).toBe(0);

      // Advancing time should not fire the handler (timer was cleared)
      jest.advanceTimersByTime(20000);
      await Promise.resolve();
      expect(handler).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('clear', () => {
    it('clears handlers and pending delay timers', async () => {
      // Arrange
      jest.useFakeTimers();
      const bus = createInMemoryEventBus();
      const handler = jest.fn(async () => {
        // no-op handler
      });
      await bus.subscribe('sms.prompt.canceled', 'group', handler);
      await bus.publishDelayed(
        'sms.prompt.canceled',
        { smsPromptScheduleId: 'sched-1', loadId: 'load-1', reason: 't' },
        5000,
      );

      // Act
      bus.clear();

      // Assert
      expect(bus.getPendingDelays()).toBe(0);
      expect(bus.getHandlers('sms.prompt.canceled')).toHaveLength(0);

      jest.useRealTimers();
    });
  });
});
