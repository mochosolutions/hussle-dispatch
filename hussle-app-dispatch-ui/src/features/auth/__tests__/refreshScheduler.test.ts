import { schedule, cancel, __test_getState } from '../refreshScheduler';
import { PROACTIVE_REFRESH_LEAD_MS } from '../refreshConstants';

describe('refreshScheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    cancel();
    jest.useRealTimers();
  });

  const isoFromNow = (ms: number): string => new Date(Date.now() + ms).toISOString();

  describe('schedule', () => {
    it('fires refreshFn once after delay = expiresAt - now - lead', () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const oneHourMs = 60 * 60 * 1000;

      schedule(isoFromNow(oneHourMs), fn);

      expect(fn).not.toHaveBeenCalled();

      // Advance to (1h - lead) - 1ms — still before fire
      jest.advanceTimersByTime(oneHourMs - PROACTIVE_REFRESH_LEAD_MS - 1);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels the prior timer when called a second time', () => {
      const first = jest.fn().mockResolvedValue(undefined);
      const second = jest.fn().mockResolvedValue(undefined);
      const oneHourMs = 60 * 60 * 1000;

      schedule(isoFromNow(oneHourMs), first);
      schedule(isoFromNow(oneHourMs), second);

      jest.advanceTimersByTime(oneHourMs);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('ignores an invalid expiresAt without throwing', () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      schedule('not-a-date', fn);
      jest.advanceTimersByTime(60 * 60 * 1000);

      expect(fn).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(__test_getState()?.timeoutHandle).toBeNull();
      warnSpy.mockRestore();
    });
  });

  describe('cancel', () => {
    it('clears the timeout and removes the visibility listener', () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const oneHourMs = 60 * 60 * 1000;

      schedule(isoFromNow(oneHourMs), fn);
      cancel();

      jest.advanceTimersByTime(oneHourMs * 2);
      expect(fn).not.toHaveBeenCalled();

      const state = __test_getState();
      expect(state?.timeoutHandle).toBeNull();
      expect(state?.hasVisibilityListener).toBe(false);
    });
  });

  describe('visibilitychange', () => {
    it('fires refreshFn immediately when visible and within lead window', () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      // 2 minutes from now — inside the default 5-minute lead window
      const twoMinMs = 2 * 60 * 1000;

      schedule(isoFromNow(twoMinMs), fn);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not fire when visible but outside the lead window', () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      // 1 hour out — well outside the 5-minute lead window
      const oneHourMs = 60 * 60 * 1000;

      schedule(isoFromNow(oneHourMs), fn);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(fn).not.toHaveBeenCalled();
    });

    it('does not fire when document is hidden, even near expiry', () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const twoMinMs = 2 * 60 * 1000;

      schedule(isoFromNow(twoMinMs), fn);

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(fn).not.toHaveBeenCalled();
    });
  });
});
