// ---------------------------------------------------------------------------
// ReviewStep — read-only summary of every completed step's answers.
//
// Behavior (US-20):
//   - Iterates `getVisibleSteps(onboardingSchema, session)` filtered to
//     steps that are in `session.completedStepIds` and aren't this step.
//   - For each, renders a card with the step title + key/value rows.
//   - Each row has an "Edit" link that dispatches `navigateToStep({ stepId })`.
//   - When the session is locked AND the target step is in the company phase,
//     the Edit action is disabled with a lock icon + tooltip.
//
// NOTE: `navigateToStep` is a client-only reducer in this story. The matching
// saga side-effect (persist server-side currentStepId) is deferred.
// ---------------------------------------------------------------------------

import { useCallback, useMemo } from 'react';
import { Box, Button, Stack, Tooltip } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import { Body, BodyMuted, BodyStrong, SectionTitle } from 'components/Typography';

import type { Step, VisibleStep } from 'features/carrier-portal/engine';
import { getVisibleSteps } from 'features/carrier-portal/engine';
import { onboardingSchema } from 'features/carrier-portal/schema/onboardingSchema';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectIsLocked,
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';

interface ReviewStepProps {
  step: Step;
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return JSON.stringify(value);
};

const ReviewStep: React.FC<ReviewStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const sessionLocked = useSelector(selectIsLocked);
  const submitStatus = useSelector(selectLoading('submitStep'));

  const summarySteps = useMemo<VisibleStep[]>(() => {
    if (!session) {
      return [];
    }
    return getVisibleSteps(onboardingSchema, session).filter(
      (s) => session.completedStepIds.includes(s.id) && s.id !== step.id,
    );
  }, [session, step.id]);

  const handleContinue = useCallback((): void => {
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { reviewed: true },
      }),
    );
  }, [dispatch, step.id]);

  const isPending = submitStatus === 'pending';

  useStepNavigation({
    canContinue: !isPending,
    onContinue: handleContinue,
    isPending,
  });

  if (!session) {
    return null;
  }

  const handleEdit = (stepId: string): void => {
    dispatch(carrierPortalV2Actions.navigateToStep({ stepId }));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 640 }}>
      <SectionTitle sx={{ mb: 3 }}>{step.title ?? 'Review your answers'}</SectionTitle>

      <Stack spacing={2.5}>
        {summarySteps.map((s) => {
          const answers = (session.answers[s.id] ?? {}) as Record<string, unknown>;
          const isCompanyPhaseStep = s.phaseId === 'company';
          const editDisabled = sessionLocked && isCompanyPhaseStep;

          return (
            <Box
              key={s.id}
              sx={{
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 1,
                p: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                }}
              >
                <BodyStrong>{s.title ?? s.id}</BodyStrong>
                {editDisabled ? (
                  <Tooltip title="Locked after agreement signed. Contact your dispatcher to amend.">
                    <span>
                      <Button
                        size="small"
                        disabled
                        startIcon={<LockOutlined sx={{ fontSize: 14 }} />}
                        aria-label="Edit locked"
                      >
                        Edit
                      </Button>
                    </span>
                  </Tooltip>
                ) : (
                  <Button size="small" onClick={() => handleEdit(s.id)}>
                    Edit
                  </Button>
                )}
              </Box>
              <Stack spacing={0.75}>
                {Object.keys(answers).length === 0 ? (
                  <BodyMuted>No answers recorded.</BodyMuted>
                ) : (
                  Object.entries(answers).map(([key, value]) => (
                    <Box key={key} sx={{ display: 'flex', gap: 1 }}>
                      <BodyMuted sx={{ minWidth: 140 }}>{key}</BodyMuted>
                      <Body>{formatValue(value)}</Body>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ReviewStep;
