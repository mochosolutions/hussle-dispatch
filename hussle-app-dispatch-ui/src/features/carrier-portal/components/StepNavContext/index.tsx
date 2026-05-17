// ---------------------------------------------------------------------------
// StepNavContext — lets a step renderer register its navigation handler with
// the page-level footer (PortalFooterBar). One context per CarrierPortalPage
// instance; the active step writes its `{ canContinue, onContinue, isPending,
// continueLabel }` and the page reads it to drive the single Continue button.
//
// Cleanup: when a step unmounts, its registration is cleared so the footer
// hides Continue (or another step takes over).
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface StepNavHandler {
  canContinue: boolean;
  onContinue: () => void;
  isPending: boolean;
  continueLabel?: string;
}

interface StepNavContextValue {
  handler: StepNavHandler | null;
  setHandler: (handler: StepNavHandler | null) => void;
}

const StepNavContext = createContext<StepNavContextValue | null>(null);

interface StepNavProviderProps {
  children: ReactNode;
}

export const StepNavProvider: React.FC<StepNavProviderProps> = ({ children }) => {
  const [handler, setHandler] = useState<StepNavHandler | null>(null);
  // Memoize the context value so consumer effects don't re-fire on every
  // provider render. `setHandler` is already stable from useState.
  const value = useMemo<StepNavContextValue>(() => ({ handler, setHandler }), [handler]);
  return <StepNavContext.Provider value={value}>{children}</StepNavContext.Provider>;
};

export const useStepNavHandler = (): StepNavHandler | null => {
  const ctx = useContext(StepNavContext);
  return ctx?.handler ?? null;
};

/**
 * Register a step's submit handler with the page-level footer. The handler is
 * automatically cleared on unmount so navigating to a different step does not
 * leave a stale Continue button bound to the previous step.
 *
 * Callers MUST pass a stable `onContinue` (wrap with `useCallback`) — the
 * effect re-runs whenever any field of the handler changes by reference.
 */
export const useStepNavigation = (handler: StepNavHandler): void => {
  const ctx = useContext(StepNavContext);
  const setHandler = ctx?.setHandler;
  const { canContinue, onContinue, isPending, continueLabel } = handler;
  useEffect(() => {
    if (!setHandler) {
      return;
    }
    setHandler({ canContinue, onContinue, isPending, continueLabel });
    return () => {
      setHandler(null);
    };
  }, [setHandler, canContinue, onContinue, isPending, continueLabel]);
};

export { StepNavContext };

// ---------------------------------------------------------------------------
// Test helper — wraps children in a StepNavProvider and exposes the latest
// registered handler via a ref so tests can invoke `onContinue()` and assert
// `canContinue` / `isPending` without rendering the page-level footer.
// ---------------------------------------------------------------------------

export interface StepNavTestHandle {
  current: StepNavHandler | null;
}

interface TestStepNavProviderProps {
  handle: StepNavTestHandle;
  children: ReactNode;
}

export const TestStepNavProvider: React.FC<TestStepNavProviderProps> = ({ handle, children }) => {
  const [handler, setHandlerState] = useState<StepNavHandler | null>(null);
  const setHandler = (next: StepNavHandler | null): void => {
    handle.current = next;
    setHandlerState(next);
  };
  const value = useMemo<StepNavContextValue>(() => ({ handler, setHandler }), [handler]);
  return <StepNavContext.Provider value={value}>{children}</StepNavContext.Provider>;
};

