// ---------------------------------------------------------------------------
// CheckpointStep — celebratory milestone screen between phases.
//
// Behavior (US-20):
//   - Reads `phase.checkpoint` (title, body, optional upcoming[]).
//   - Renders a centered card: large green check, title, body, optional
//     "Coming up next" list, "Continue" button.
//   - "Continue" dispatches `submitStep({ stepId, answers: { acknowledged: true } })`.
//
// The current schema has no phases with a checkpoint declared — the dispatcher
// resolves `phase` from the step's id and passes it as a prop.
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { Box, Stack } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

import { useDispatch } from 'store';
import { Body, BodyMuted, PageTitle } from 'components/Typography';

import type { Phase, Step } from 'features/carrier-portal/engine';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';

interface CheckpointStepProps {
  step: Step;
  phase: Phase;
}

const CheckpointStep: React.FC<CheckpointStepProps> = ({ step, phase }) => {
  const dispatch = useDispatch();

  const checkpoint = phase.checkpoint;

  const handleContinue = useCallback((): void => {
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { acknowledged: true },
      }),
    );
  }, [dispatch, step.id]);

  useStepNavigation({
    canContinue: true,
    onContinue: handleContinue,
    isPending: false,
  });

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

      <PageTitle sx={{ mb: 1 }}>{checkpoint?.title ?? 'Nice work.'}</PageTitle>

      {checkpoint?.body ? (
        <BodyMuted sx={{ mb: 3, fontSize: 14, lineHeight: 1.55 }}>{checkpoint.body}</BodyMuted>
      ) : null}

      {checkpoint?.upcoming && checkpoint.upcoming.length > 0 ? (
        <Box sx={{ mb: 3, textAlign: 'left', display: 'inline-block' }}>
          <BodyMuted sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', mb: 1 }}>
            COMING UP NEXT
          </BodyMuted>
          <Stack spacing={0.75}>
            {checkpoint.upcoming.map((item) => (
              <Body key={item}>• {item}</Body>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default CheckpointStep;
