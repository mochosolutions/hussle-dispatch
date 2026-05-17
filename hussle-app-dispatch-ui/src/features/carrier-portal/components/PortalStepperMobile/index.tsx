import { Box, LinearProgress } from '@mui/material';

import { BodyStrong, Meta } from 'components/Typography';

interface PortalStepperMobileProps {
  activePhaseLabel: string;
  activePhaseNumber: number;
  totalPhases: number;
  progressPercent: number;
  subText?: string;
}

const PortalStepperMobile: React.FC<PortalStepperMobileProps> = ({
  activePhaseLabel,
  activePhaseNumber,
  totalPhases,
  progressPercent,
  subText,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <BodyStrong sx={{ fontSize: 13 }}>{activePhaseLabel}</BodyStrong>
        <Meta sx={{ fontSize: 12 }}>
          Phase {activePhaseNumber} of {totalPhases}
        </Meta>
      </Box>

      <LinearProgress
        variant="determinate"
        value={clampedProgress}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: 'primary.main',
            borderRadius: 2,
          },
        }}
      />

      {subText ? (
        <Meta sx={{ fontSize: 11, mt: 0.75, display: 'block' }}>{subText}</Meta>
      ) : null}
    </Box>
  );
};

export default PortalStepperMobile;
