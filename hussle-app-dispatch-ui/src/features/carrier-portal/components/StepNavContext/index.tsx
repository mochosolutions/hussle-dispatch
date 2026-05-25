// ---------------------------------------------------------------------------
// StepNavContext — lets a step renderer register its navigation handler with
// the page-level footer (PortalFooterBar). One context per CarrierPortalPage
// instance; the active step writes its `{ canContinue, onContinue, isPending,
// continueLabel }` and the page reads it to drive the single Continue button.
//
// Also carries the step's runtime `mode` (active/review/locked) so step
// components can branch on it (e.g. skip auto-advance) and the shell can
// override the footer Continue in non-active modes.
//
// Cleanup: when a step unmounts, its registration is cleared so the footer
// hides Continue (or another step takes over).
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { StepMode } from 'features/carrier-portal/engine';

export interface StepNavHandler {
  canContinue: boolean;
  onContinue: () => void;
  isPending: boolean;
  continueLabel?: string;
}

interface StepNavContextValue {
  handler: StepNavHandler | null;
  setHandler: (handler: StepNavHandler | null) => void;
  mode: StepMode;
}

const StepNavContext = createContext<StepNavContextValue | null>(null);

interface StepNavProviderProps {
  children: ReactNode;
  mode?: StepMode;
}

export const StepNavProvider: React.FC<StepNavProviderProps> = ({ children, mode = 'active' }) => {
  const [handler, setHandler] = useState<StepNavHandler | null>(null);
  // Memoize the context value so consumer effects don't re-fire on every
  // provider render. `setHandler` is already stable from useState.
  const value = useMemo<StepNavContextValue>(
    () => ({ handler, setHandler, mode }),
    [handler, setHandler, mode],
  );
  return <StepNavContext.Provider value={value}>{children}</StepNavContext.Provider>;
};

export const useStepNavHandler = (): StepNavHandler | null => {
  const ctx = useContext(StepNavContext);
  return ctx?.handler ?? null;
};

// Read the current step's mode. Defaults to `'active'` when no provider is
// mounted — keeps step components renderable in isolation (Storybook, unit
// tests) without forcing every test to wrap in a provider.
export const useStepMode = (): StepMode => {
  const ctx = useContext(StepNavContext);
  return ctx?.mode ?? 'active';
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
  mode?: StepMode;
}

export const TestStepNavProvider: React.FC<TestStepNavProviderProps> = ({
  handle: handleRef,
  children,
  mode = 'active',
}) => {
  const [handler, setHandlerState] = useState<StepNavHandler | null>(null);
  const setHandler = useCallback(
    (next: StepNavHandler | null): void => {
      handleRef.current = next;
      setHandlerState(next);
    },
    [handleRef],
  );
  const value = useMemo<StepNavContextValue>(
    () => ({ handler, setHandler, mode }),
    [handler, setHandler, mode],
  );
  return <StepNavContext.Provider value={value}>{children}</StepNavContext.Provider>;
};

// ---------------------------------------------------------------------------
// StepChromeContext — lets a step view replace the PortalShell stepper +
// footer slots from inside the route Outlet. Used by AgreementSigningStep's
// focus + success views to render FocusHeader in the top bar and FocusFooter
// (focus only) sticky at the viewport bottom — matching the dev preview
// composition that uses PortalShell directly with `stepper={<FocusHeader/>}`.
//
// Semantics:
//   - chrome === null  → no view-level override; page uses its defaults.
//   - chrome === { stepperSlot, footerSlot }  → override is active. Each slot
//     can be `undefined` to opt out of rendering that slot at all.
// ---------------------------------------------------------------------------

export interface StepChromeSlots {
  stepperSlot?: ReactNode;
  footerSlot?: ReactNode;
}

interface StepChromeContextValue {
  chrome: StepChromeSlots | null;
  setChrome: (next: StepChromeSlots | null) => void;
}

const StepChromeContext = createContext<StepChromeContextValue | null>(null);

interface StepChromeProviderProps {
  children: ReactNode;
}

export const StepChromeProvider: React.FC<StepChromeProviderProps> = ({ children }) => {
  const [chrome, setChrome] = useState<StepChromeSlots | null>(null);
  const value = useMemo<StepChromeContextValue>(() => ({ chrome, setChrome }), [chrome]);
  return <StepChromeContext.Provider value={value}>{children}</StepChromeContext.Provider>;
};

/**
 * Reader hook — returns the currently-registered chrome override, or `null`
 * when no view has registered. The CarrierPortalPage reads this to decide
 * whether to render its default stepper/footer or the view's overrides.
 */
export const useStepChromeOverrides = (): StepChromeSlots | null => {
  const ctx = useContext(StepChromeContext);
  return ctx?.chrome ?? null;
};

/**
 * Register chrome overrides for the active step view. Cleared automatically
 * on unmount.
 *
 * Callers MUST memoize `stepperSlot` and `footerSlot` (e.g. via `useMemo`) —
 * the effect re-runs whenever the slot identity changes, which would cause
 * infinite re-registration otherwise.
 */
export const useStepChromeOverride = (slots: StepChromeSlots): void => {
  const ctx = useContext(StepChromeContext);
  const setChrome = ctx?.setChrome;
  const { stepperSlot, footerSlot } = slots;
  useEffect(() => {
    if (!setChrome) {
      return;
    }
    setChrome({ stepperSlot, footerSlot });
    return () => {
      setChrome(null);
    };
  }, [setChrome, stepperSlot, footerSlot]);
};

export { StepChromeContext };

// ---------------------------------------------------------------------------
// Test helper — mirrors TestStepNavProvider. Captures the registered chrome
// in `handle.current` AND renders the slots inline (wrapped in queryable
// data-testid divs) so existing tests that assert on FocusHeader/FocusFooter
// content keep working without rendering the full page chrome.
// ---------------------------------------------------------------------------

export interface StepChromeTestHandle {
  current: StepChromeSlots | null;
}

interface TestStepChromeProviderProps {
  handle?: StepChromeTestHandle;
  children: ReactNode;
}

export const TestStepChromeProvider: React.FC<TestStepChromeProviderProps> = ({
  handle: handleRef,
  children,
}) => {
  const [chrome, setChromeState] = useState<StepChromeSlots | null>(null);
  const setChrome = useCallback(
    (next: StepChromeSlots | null): void => {
      if (handleRef) {
        handleRef.current = next;
      }
      setChromeState(next);
    },
    [handleRef],
  );
  const value = useMemo<StepChromeContextValue>(() => ({ chrome, setChrome }), [chrome, setChrome]);
  return (
    <StepChromeContext.Provider value={value}>
      {children}
      {chrome?.stepperSlot ? (
        <div data-testid="test-chrome-stepper">{chrome.stepperSlot}</div>
      ) : null}
      {chrome?.footerSlot ? (
        <div data-testid="test-chrome-footer">{chrome.footerSlot}</div>
      ) : null}
    </StepChromeContext.Provider>
  );
};
