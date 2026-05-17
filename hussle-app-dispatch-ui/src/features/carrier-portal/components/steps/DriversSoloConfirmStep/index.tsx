// ---------------------------------------------------------------------------
// DriversSoloConfirmStep — celebratory confirmation for the owner-operator path.
//
// Renders when `drivers.hasEmployeeDrivers === 'no'`. Continue dispatches
// `submitStep({ stepId, answers: { confirmed: true } })` with an empty
// `entries` array to keep the drivers answer shape consistent.
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { Box } from '@mui/material';
import { PersonOutline } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import { BodyMuted } from 'components/Typography';

import type { Step } from 'features/carrier-portal/engine';
import OnboardingCard from 'features/carrier-portal/components/OnboardingCard';
import { useStepNavigation } from 'features/carrier-portal/components/StepNavContext';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectLoading,
  selectSession,
} from '../../../store/selectors/carrierPortalSelectors';

interface DriversSoloConfirmStepProps {
  step: Step;
}

const DriversSoloConfirmStep: React.FC<DriversSoloConfirmStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const submitStatus = useSelector(selectLoading('submitStep'));

  const handleContinue = useCallback((): void => {
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { confirmed: true, entries: [] },
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

  return (
    <OnboardingCard
      phase="Drivers"
      title={step.title ?? "Got it — you're the only driver running loads."}
      subtitle={
        step.subtitle ??
        "We'll set you up as the sole driver on every dispatched load. You can invite teammates later from Settings."
      }
      width="md"
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 2,
          py: 3,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'primary.100',
            color: 'primary.main',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: 32 },
          }}
        >
          <PersonOutline />
        </Box>
        <BodyMuted sx={{ fontSize: 14, lineHeight: 1.55, maxWidth: 440 }}>
          We&apos;ve recorded that you operate solo. Loads dispatched from your fleet will be
          assigned to you automatically.
        </BodyMuted>
      </Box>
    </OnboardingCard>
  );
};

export default DriversSoloConfirmStep;
