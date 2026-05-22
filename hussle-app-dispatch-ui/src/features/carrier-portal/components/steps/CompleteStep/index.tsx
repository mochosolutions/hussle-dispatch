// ---------------------------------------------------------------------------
// CompleteStep — final "you're submitted" screen.
//
// Layout (per docs/screenshots/onboarding/carrier_complete.png):
//   - Centered green check circle.
//   - Personalized headline `You're submitted, {firstName(signatoryName)}.`
//   - Body referencing the dispatcher by name (from `session.invitation.dispatcher`).
//   - "WHAT YOU COMPLETED" summary card iterating `session.completedStepIds`,
//     using each step's optional `completeSummary(answers)` formatter or
//     falling back to the step title.
//   - Info Callout pointing at the first-load notification.
//
// B9 additions:
//   - BUG-12: dispatches `completeSession` once on mount (ref-guarded) to call
//             POST /carrier-portal/session/complete. Until the round-trip
//             succeeds (session.completedAt becomes set), the cheerful copy is
//             swapped for a quieter "Wrapping up your onboarding..." state.
//   - UX-02:  adds a Sign Agreement row to the summary that reads the typed
//             Agreement state from Redux (`selectAgreement`). SIGNED → check;
//             anything else → muted "Sign Agreement".
//   - UX-03:  adds a primary terminal CTA — "Take me to my carrier
//             dashboard". For now this navigates to `/` (matches Save & Exit
//             behavior); when a carrier dashboard route lands this becomes a
//             one-line update.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';
import { Box, Button, CircularProgress, Stack } from '@mui/material';
import { CheckCircleOutline, CheckOutlined } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import { Body, BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import type { Step } from 'features/carrier-portal/engine';
import { findStep } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';
import Callout from 'features/carrier-portal/components/Callout';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectAgreement,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';

interface CompleteStepProps {
  step: Step;
}

interface SummaryRow {
  key: string;
  line: string;
  signed: boolean;
}

const SIGN_AGREEMENT_STEP_ID = 'sign-agreement';

const firstNameOf = (fullName: string | undefined): string => {
  if (!fullName) {
    return 'there';
  }
  const first = fullName.split(' ')[0];
  return first.length > 0 ? first : 'there';
};

const CompleteStep: React.FC<CompleteStepProps> = ({ step }) => {
  void step;
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const agreement = useSelector(selectAgreement);
  const completeDispatched = useRef(false);

  const isComplete = Boolean(session?.completedAt);

  // BUG-12 — fire completeSession exactly once on mount (ref-guarded). The
  // server-side endpoint flips Carrier.status to ACTIVE and stamps
  // OnboardingSession.completedAt. Until that round-trip lands, the UI shows
  // a quieter "Wrapping up..." state (see below).
  useEffect(() => {
    if (!session || isComplete || completeDispatched.current) {
      return;
    }
    completeDispatched.current = true;
    dispatch(carrierPortalV2Actions.completeSession());
  }, [dispatch, session, isComplete]);

  const summaryRows = useMemo<SummaryRow[]>(() => {
    if (!session) {
      return [];
    }
    const rows: SummaryRow[] = [];
    let agreementRowInserted = false;

    const pushAgreementRow = (): void => {
      if (agreementRowInserted) {
        return;
      }
      agreementRowInserted = true;
      const signed = agreement?.status === 'SIGNED';
      rows.push({
        key: SIGN_AGREEMENT_STEP_ID,
        line: signed ? 'Dispatch agreement signed' : 'Sign Agreement',
        signed,
      });
    };

    for (const stepId of session.completedStepIds) {
      // Sign-agreement state is driven by the typed Agreement table, not by
      // completedStepIds. Skip and render an explicit row instead (UX-02).
      if (stepId === SIGN_AGREEMENT_STEP_ID) {
        pushAgreementRow();
        continue;
      }
      const schemaStep = findStep(onboardingSchema, stepId);
      if (!schemaStep) {
        continue;
      }
      let line: string;
      if (typeof schemaStep.completeSummary === 'function') {
        line = schemaStep.completeSummary(session.answers);
      } else {
        line = schemaStep.title ?? schemaStep.id;
      }
      rows.push({ key: stepId, line, signed: true });
    }

    // If sign-agreement wasn't in completedStepIds (e.g. SIGNED reached the
    // Agreement record but the step wasn't marked complete), surface it
    // anyway so the summary always reflects the agreement table.
    if (!agreementRowInserted && agreement) {
      pushAgreementRow();
    }

    return rows;
  }, [session, agreement]);

  if (!session) {
    return null;
  }

  const confirmAnswers = (session.answers['company-confirm'] ?? {}) as Record<string, unknown>;
  const authorityAnswers = (session.answers['company-authority-question'] ?? {}) as Record<
    string,
    unknown
  >;
  const signatoryName =
    (typeof confirmAnswers.signatoryName === 'string' ? confirmAnswers.signatoryName : undefined) ??
    (typeof authorityAnswers.signatoryName === 'string'
      ? authorityAnswers.signatoryName
      : undefined);
  const firstName = firstNameOf(signatoryName);

  const dispatcher = session.invitation.dispatcher;
  const dispatcherName = dispatcher
    ? [dispatcher.firstName, dispatcher.lastName].filter(Boolean).join(' ').trim() ||
      'Your dispatcher'
    : 'Your dispatcher';

  // UX-03 — terminal CTA. No carrier dashboard route exists yet, so route to
  // `/` (matches the existing Save & Exit pattern). Easy one-line update when
  // a real dashboard lands.
  const handleGoToDashboard = (): void => {
    window.location.href = '/';
  };

  // BUG-12 gating — until the server confirms completion, render a quieter
  // "Wrapping up..." state instead of the triumphant copy + summary.
  if (!isComplete) {
    return (
      <Box sx={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            mb: 2.5,
          }}
        >
          <CircularProgress size={40} />
        </Box>
        <PageTitle sx={{ mb: 1.5 }}>Wrapping up your onboarding...</PageTitle>
        <BodyMuted sx={{ fontSize: 14, lineHeight: 1.6 }}>
          Hang tight for a moment while we finalize your application.
        </BodyMuted>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'rgba(220, 252, 231, 1)',
          color: 'rgba(22, 163, 74, 1)',
          mb: 2.5,
          '& svg': { fontSize: 40 },
        }}
      >
        <CheckCircleOutline />
      </Box>

      <PageTitle sx={{ mb: 1.5 }}>You&apos;re submitted, {firstName}.</PageTitle>

      <BodyMuted sx={{ mb: 3.5, fontSize: 14, lineHeight: 1.6 }}>
        {dispatcherName} will review your application and activate your account — usually within a
        few hours. You&apos;ll get a text when you&apos;re live.
      </BodyMuted>

      {summaryRows.length > 0 ? (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 1,
            p: 2.5,
            textAlign: 'left',
            mb: 2,
          }}
        >
          <KpiLabel sx={{ mb: 1.5, fontSize: 11, letterSpacing: '0.1em' }}>
            WHAT YOU COMPLETED
          </KpiLabel>
          <Stack spacing={1}>
            {summaryRows.map(({ key, line, signed }) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckOutlined
                  sx={{
                    fontSize: 18,
                    color: signed ? 'rgba(22, 163, 74, 1)' : 'grey.400',
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                />
                {signed ? (
                  <Body sx={{ fontSize: 14, lineHeight: 1.5 }}>{line}</Body>
                ) : (
                  <BodyMuted sx={{ fontSize: 14, lineHeight: 1.5 }}>{line}</BodyMuted>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box sx={{ textAlign: 'left', mb: 3 }}>
        <Callout variant="amber">
          <strong>One thing to do after activation</strong> — Watch for your first load
          notification. You&apos;ll have 30 minutes to accept or decline.
        </Callout>
      </Box>

      <Button variant="contained" size="large" fullWidth onClick={handleGoToDashboard}>
        Take me to my carrier dashboard
      </Button>
    </Box>
  );
};

export default CompleteStep;
