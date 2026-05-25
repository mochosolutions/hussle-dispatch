import { useEffect, useMemo, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { useSelector, useDispatch } from 'store';
import { carrierPortalV2Actions } from '../../store/reducers/carrierPortalSlice';
import {
  selectOnboardingComplete,
  selectSession,
  selectCurrentStep,
} from '../../store/selectors/carrierPortalSelectors';
import {
  computeStepMode,
  findPhaseOfStep,
  findStep,
  getNextStepId,
  getPrevStepId,
} from '../../engine';
import { onboardingSchema } from '../../schema/onboardingSchema';
import PortalAuthGuard from '../../components/PortalAuthGuard';
import PortalShell from '../../components/PortalShell';
import PortalStepper from '../../components/PortalStepper';
import type { PortalStepperPhase } from '../../components/PortalStepper';
import PortalFooterBar from '../../components/PortalFooterBar';
import LockedFieldsBanner from '../../components/LockedFieldsBanner';
import {
  StepNavProvider,
  StepChromeProvider,
  useStepMode,
  useStepNavHandler,
  useStepChromeOverrides,
} from '../../components/StepNavContext';

// ---------------------------------------------------------------------------
// Phase-state derivation — maps schema phases to PortalStepper display states.
// ---------------------------------------------------------------------------

const buildStepperPhases = (
  currentPhaseId: string | null,
): PortalStepperPhase[] => {
  let passed = true;

  return onboardingSchema.phases.map((phase) => {
    let state: PortalStepperPhase['state'];

    if (phase.id === currentPhaseId) {
      state = 'active';
      passed = false;
    } else if (passed) {
      state = 'done';
    } else {
      state = 'pending';
    }

    return { id: phase.id, label: phase.label, state };
  });
};

// ---------------------------------------------------------------------------
// Loading fallback — shown while session resolves before guard passes.
// ---------------------------------------------------------------------------

const SessionLoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    }}
  >
    <CircularProgress size={32} />
  </Box>
);

// ---------------------------------------------------------------------------
// PortalPageContent — reads the registered step handler and renders chrome.
// Mounted inside StepNavProvider so it can both render <Outlet /> (whose
// children call useStepNavigation to register their submit handler) AND read
// the registered handler via useStepNavHandler() to drive the single Continue
// button in the footer.
// ---------------------------------------------------------------------------

interface PortalRouteParams extends Record<string, string | undefined> {
  token?: string;
  stepId?: string;
  // React Router v6 wildcard capture for `:stepId/*`. Sub-views (e.g. the
  // AgreementSigningStep focus + success views) consume this via their own
  // useParams calls inside the Outlet. The page itself no longer reads it —
  // chrome differences are driven by useStepChromeOverride, not the URL shape.
  '*'?: string;
}

const PortalPageContent = () => {
  const navigate = useNavigate();
  const { token, stepId: urlStepId } = useParams<PortalRouteParams>();
  const session = useSelector(selectSession);
  const currentStep = useSelector(selectCurrentStep);
  const onboardingComplete = useSelector(selectOnboardingComplete);
  const stepNav = useStepNavHandler();
  const mode = useStepMode();
  const chromeOverride = useStepChromeOverrides();

  // Terminal-state guard — once onboarding is complete, every wizard URL
  // redirects to `/complete`. Carriers can revisit the link indefinitely to
  // see the confirmation screen; they can't re-enter the editable wizard.
  useEffect(() => {
    if (!onboardingComplete || !token) return;
    if (urlStepId === 'complete') return;
    navigate(`/carrier-portal/${token}/complete`, { replace: true });
  }, [onboardingComplete, token, urlStepId, navigate]);

  // URL ↔ Redux sync.
  // Rules:
  //   1. No :stepId in URL (initial cold load) → push the server cursor
  //      (session.currentStepId) into the URL.
  //   2. Cursor moved forward (post-submit advance) → push URL to match.
  //   3. URL :stepId is unknown to the schema → snap to the cursor.
  //   4. URL :stepId is a completed step (user navigated back) → leave the
  //      user there (review mode). Locked fields display, editable fields
  //      remain editable.
  //   5. URL :stepId is unknown / not-yet-completed and not the cursor →
  //      user is skipping ahead; snap back to the cursor.
  const prevCursorRef = useRef<string | null>(null);
  const prevUrlStepIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prevCursor = prevCursorRef.current;
    const prevUrlStepId = prevUrlStepIdRef.current;
    const cursor = session?.currentStepId ?? null;
    prevCursorRef.current = cursor;
    prevUrlStepIdRef.current = urlStepId;

    if (!token || !session || !cursor) return;
    if (!urlStepId) {
      navigate(`/carrier-portal/${token}/${cursor}`, { replace: true });
      return;
    }
    if (urlStepId === cursor) return;

    // Initial mount / first sync after session resolves. If the URL points
    // at a completed step (refresh-while-in-review, bookmarked review URL),
    // leave the user there — review/locked mode is intentional. Otherwise
    // snap to the cursor (stale or typed-ahead URL).
    if (prevCursor === null) {
      const stepExists = findStep(onboardingSchema, urlStepId) !== undefined;
      const isCompleted = session.completedStepIds.includes(urlStepId);
      if (!stepExists || !isCompleted) {
        navigate(`/carrier-portal/${token}/${cursor}`, { replace: true });
      }
      return;
    }

    // Cursor moved forward (e.g. submitStepSuccess) while the URL didn't.
    // Carry the URL forward so the user lands on the new step.
    if (prevCursor !== cursor && prevUrlStepId === urlStepId) {
      navigate(`/carrier-portal/${token}/${cursor}`, { replace: true });
      return;
    }

    // User actively navigated to this step (urlStepId changed). If it's a
    // completed step → review mode, leave them. Otherwise it's invalid or
    // not-yet-reached → snap to cursor.
    const stepExists = findStep(onboardingSchema, urlStepId) !== undefined;
    const isCompleted = session.completedStepIds.includes(urlStepId);
    if (!stepExists || (!isCompleted && urlStepId !== cursor)) {
      navigate(`/carrier-portal/${token}/${cursor}`, { replace: true });
    }
  }, [token, session, urlStepId, navigate]);

  // The "active step" for chrome (footer phase label, stepper highlighting)
  // is driven by the URL — so when the user navigates back to a completed
  // step for review, the chrome reflects that step (not the server cursor).
  const activeStep = useMemo(
    () => (urlStepId ? findStep(onboardingSchema, urlStepId) : currentStep),
    [urlStepId, currentStep],
  );

  const phase = useMemo(() => {
    if (!activeStep) return null;
    return findPhaseOfStep(onboardingSchema, activeStep.id) ?? null;
  }, [activeStep]);

  const stepperPhases = useMemo(
    () => buildStepperPhases(phase?.id ?? null),
    [phase],
  );

  const prevStepId = useMemo(() => {
    if (!session || !activeStep) return null;
    return getPrevStepId(onboardingSchema, session, activeStep.id);
  }, [session, activeStep]);

  const handleBack = () => {
    if (prevStepId && token) {
      // Navigate the URL directly. Don't dispatch navigateToStep — that
      // would rewind the server cursor in Redux, which breaks review-mode
      // and clobbers the locked state for already-signed agreements.
      navigate(`/carrier-portal/${token}/${prevStepId}`);
    }
  };

  const handleSaveExit = () => {
    window.location.href = '/';
  };

  // In review/locked modes the step component doesn't register a Continue
  // handler (it would otherwise auto-advance the cursor). The shell supplies
  // a Continue button that walks the URL one step forward through the
  // visible flow.
  const reviewContinue = useMemo(() => {
    if (mode === 'active' || !activeStep || !session || !token) return undefined;
    const nextId = getNextStepId(onboardingSchema, session, activeStep.id);
    if (!nextId) return undefined;
    return () => navigate(`/carrier-portal/${token}/${nextId}`);
  }, [mode, activeStep, session, token, navigate]);

  const continueHandler = reviewContinue ?? stepNav?.onContinue;
  const continueLabel = reviewContinue ? 'Continue' : (stepNav?.continueLabel ?? 'Continue');
  const continuePending = reviewContinue ? false : (stepNav?.isPending ?? false);

  const defaultFooter = activeStep && phase ? (
    <PortalFooterBar
      phaseLabel={phase.label}
      metaText={activeStep.title ?? activeStep.id}
      helperText="✓ Progress saved"
      onBack={prevStepId ? handleBack : undefined}
      secondaryAction={{ label: 'Save & Exit', onClick: handleSaveExit }}
      onContinue={continueHandler}
      continueLabel={continueLabel}
      continueDisabled={continuePending}
      isContinuing={continuePending}
    />
  ) : undefined;

  const defaultStepper = session ? <PortalStepper phases={stepperPhases} /> : undefined;

  return (
    <PortalShell
      stepper={chromeOverride ? chromeOverride.stepperSlot : defaultStepper}
      footer={chromeOverride ? chromeOverride.footerSlot : defaultFooter}
    >
      {session && activeStep ? (
        // PortalShell main uses `display: flex; justify-content: center`, so
        // direct children become row siblings. Wrap banner + Outlet in a
        // column container that matches OnboardingCard's max-width so the
        // banner aligns with the form below it.
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: 760,
          }}
        >
          {mode === 'locked' ? <LockedFieldsBanner /> : null}
          <Outlet />
        </Box>
      ) : (
        <SessionLoadingFallback />
      )}
    </PortalShell>
  );
};

// ---------------------------------------------------------------------------
// PortalSession — computes the current step mode from URL + session and
// provides it to StepNavProvider. Sits between the auth guard (which owns
// session loading concerns) and the content (which renders chrome).
// ---------------------------------------------------------------------------

const PortalSession = () => {
  const { stepId: urlStepId } = useParams<PortalRouteParams>();
  const session = useSelector(selectSession);

  const mode = useMemo(() => {
    if (!session) return 'active';
    return computeStepMode(onboardingSchema, session, urlStepId ?? null);
  }, [session, urlStepId]);

  return (
    <StepChromeProvider>
      <StepNavProvider mode={mode}>
        <PortalPageContent />
      </StepNavProvider>
    </StepChromeProvider>
  );
};

// ---------------------------------------------------------------------------
// CarrierPortalPage — owns session loading; delegates mode + chrome to
// PortalSession + PortalPageContent.
// ---------------------------------------------------------------------------

const CarrierPortalPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(carrierPortalV2Actions.loadSession());
  }, [dispatch]);

  return (
    <PortalAuthGuard>
      <PortalSession />
    </PortalAuthGuard>
  );
};

export default CarrierPortalPage;
