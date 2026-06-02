import { Box, Button, CircularProgress, Stack } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

import { Meta, SectionTitle } from 'components/Typography';

interface CurrentStageCardProps {
  stageLabel: string;
  stageOf: string;
  nextStopLabel?: string;
  ctaLabel: string;
  onAdvance: () => void;
  updating: boolean;
}

// Dark "current stage" hero card with the primary advance-status CTA.
export const CurrentStageCard: React.FC<CurrentStageCardProps> = ({
  stageLabel,
  stageOf,
  nextStopLabel,
  ctaLabel,
  onAdvance,
  updating,
}) => (
  <Box sx={{ bgcolor: 'primary.dark', color: 'common.white', borderRadius: 2, p: { xs: 2.5, md: 3 } }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
      <Meta sx={{ color: 'common.white', opacity: 0.7, letterSpacing: '0.06em' }}>
        CURRENT STAGE
      </Meta>
      <Meta sx={{ color: 'common.white', opacity: 0.7 }}>{stageOf}</Meta>
    </Stack>

    <SectionTitle sx={{ color: 'common.white', fontSize: '1.5rem' }}>{stageLabel}</SectionTitle>

    {nextStopLabel ? (
      <Meta sx={{ color: 'common.white', opacity: 0.85, mt: 0.5, display: 'block' }}>
        Next stop · {nextStopLabel}
      </Meta>
    ) : null}

    <Button
      variant="contained"
      size="large"
      fullWidth
      onClick={onAdvance}
      disabled={updating}
      endIcon={updating ? undefined : <ArrowForward />}
      sx={{ mt: 2, py: 1.5, fontSize: '1.05rem', fontWeight: 600 }}
    >
      {updating ? <CircularProgress size={24} color="inherit" /> : ctaLabel}
    </Button>
  </Box>
);

export default CurrentStageCard;
