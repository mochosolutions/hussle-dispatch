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
//   - No CTA — this is the terminal screen.
// ---------------------------------------------------------------------------

import { useMemo } from 'react';
import { Box, Stack } from '@mui/material';
import { CheckCircleOutline, CheckOutlined } from '@mui/icons-material';

import { useSelector } from 'store';
import { Body, BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import type { Step } from 'features/carrier-portal/engine';
import { findStep } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';
import Callout from 'features/carrier-portal/components/Callout';

import { selectSession } from '../../../store/selectors/carrierPortalSelectors';

interface CompleteStepProps {
  step: Step;
}

const firstNameOf = (fullName: string | undefined): string => {
  if (!fullName) {
    return 'there';
  }
  const first = fullName.split(' ')[0];
  return first.length > 0 ? first : 'there';
};

const CompleteStep: React.FC<CompleteStepProps> = ({ step }) => {
  void step;
  const session = useSelector(selectSession);

  const summaryLines = useMemo<{ stepId: string; line: string }[]>(() => {
    if (!session) {
      return [];
    }
    const lines: { stepId: string; line: string }[] = [];
    for (const stepId of session.completedStepIds) {
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
      lines.push({ stepId, line });
    }
    return lines;
  }, [session]);

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

      {summaryLines.length > 0 ? (
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
            {summaryLines.map(({ stepId, line }) => (
              <Box key={stepId} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckOutlined
                  sx={{ fontSize: 18, color: 'rgba(22, 163, 74, 1)', mt: 0.25, flexShrink: 0 }}
                />
                <Body sx={{ fontSize: 14, lineHeight: 1.5 }}>{line}</Body>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box sx={{ textAlign: 'left' }}>
        <Callout variant="amber">
          <strong>One thing to do after activation</strong> — Watch for your first load
          notification. You&apos;ll have 30 minutes to accept or decline.
        </Callout>
      </Box>
    </Box>
  );
};

export default CompleteStep;
