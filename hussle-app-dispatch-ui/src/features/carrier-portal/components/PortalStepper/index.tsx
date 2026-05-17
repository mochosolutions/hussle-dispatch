import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Check, LockOutlined } from '@mui/icons-material';

import { Meta } from 'components/Typography';

export type StepperPhaseState = 'pending' | 'active' | 'done' | 'locked' | 'locked-viewing';

export interface PortalStepperPhase {
  id: string;
  label: string;
  state: StepperPhaseState;
}

interface PortalStepperProps {
  phases: PortalStepperPhase[];
}

const isCompletedState = (state: StepperPhaseState): boolean =>
  state === 'done' || state === 'locked' || state === 'locked-viewing';

const badgeContent = (state: StepperPhaseState, index: number): ReactNode => {
  if (state === 'done') {
    return <Check sx={{ fontSize: 14 }} />;
  }
  if (state === 'locked' || state === 'locked-viewing') {
    return <LockOutlined sx={{ fontSize: 14 }} />;
  }
  return index + 1;
};

interface BadgeStyle {
  bgcolor: string;
  borderColor: string;
  color: string;
  boxShadow?: (theme: Theme) => string;
}

const badgeStyles = (state: StepperPhaseState): BadgeStyle => {
  switch (state) {
    case 'active':
      return {
        bgcolor: 'primary.dark',
        borderColor: 'primary.dark',
        color: 'common.white',
      };
    case 'done':
    case 'locked':
      return {
        bgcolor: 'secondary.lighter',
        borderColor: 'secondary.main',
        color: 'secondary.main',
      };
    case 'locked-viewing':
      return {
        bgcolor: 'background.paper',
        borderColor: 'primary.main',
        color: 'primary.main',
        boxShadow: (theme: Theme) => `0 0 0 3px ${theme.palette.primary[100]}`,
      };
    case 'pending':
    default:
      return {
        bgcolor: 'grey.100',
        borderColor: 'grey.200',
        color: 'text.secondary',
      };
  }
};

const labelColor = (state: StepperPhaseState): string => {
  switch (state) {
    case 'active':
    case 'locked-viewing':
      return 'primary.main';
    case 'done':
    case 'locked':
      return 'secondary.main';
    case 'pending':
    default:
      return 'text.secondary';
  }
};

const labelWeight = (state: StepperPhaseState): number =>
  state === 'pending' ? 500 : 600;

const PortalStepper: React.FC<PortalStepperProps> = ({ phases }) => {
  return (
    <Box
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={phases.length}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 900,
        mx: 'auto',
      }}
    >
      {phases.map((phase, index) => {
        const isLast = index === phases.length - 1;
        const connectorActive = isCompletedState(phase.state);

        return (
          <Box key={phase.id} sx={{ display: 'contents' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: '1.5px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  ...badgeStyles(phase.state),
                }}
              >
                {badgeContent(phase.state, index)}
              </Box>
              <Meta
                sx={{
                  fontSize: 13,
                  fontWeight: labelWeight(phase.state),
                  color: labelColor(phase.state),
                  whiteSpace: 'nowrap',
                }}
              >
                {phase.label}
              </Meta>
            </Box>

            {isLast ? null : (
              <Box
                aria-hidden
                sx={{
                  width: 28,
                  height: '1.5px',
                  mx: 1,
                  flexShrink: 0,
                  bgcolor: connectorActive ? 'secondary.main' : 'grey.200',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default PortalStepper;
