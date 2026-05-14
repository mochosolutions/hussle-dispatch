import { Box, Button, Container } from '@mui/material';
import { ArrowForward, ArrowBack } from '@mui/icons-material';
import { LoadingButton } from 'mocho/components';

import { Body } from 'components/Typography';

interface PortalFooterBarProps {
  phaseLabel: string;
  phaseNumber?: number;
  totalPhases?: number;
  onBack?: () => void;
  onContinue?: () => void;
  isContinuing?: boolean;
  canContinue?: boolean;
  onSaveExit: () => void;
}

const PortalFooterBar: React.FC<PortalFooterBarProps> = ({
  phaseLabel,
  phaseNumber,
  totalPhases,
  onBack,
  onContinue,
  isContinuing = false,
  canContinue = true,
  onSaveExit,
}) => (
  <Box
    sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      bgcolor: 'background.paper',
      borderTop: 1,
      borderColor: 'grey.200',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
      py: 1.5,
      zIndex: 1100,
    }}
  >
    <Container
      maxWidth="lg"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Body sx={{ color: 'text.secondary' }}>{phaseLabel}</Body>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {onBack ? (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBack />}
            onClick={onBack}
            disabled={isContinuing}
          >
            Back
          </Button>
        ) : null}

        {/* {phaseNumber && totalPhases ? (
          <Body sx={{ color: 'text.secondary', px: 1 }}>
            Step {phaseNumber} of {totalPhases}
          </Body>
        ) : null} */}

        {onContinue ? (
          <LoadingButton
            variant="contained"
            color="primary"
            endIcon={<ArrowForward />}
            onClick={onContinue}
            loading={isContinuing}
            // disabled={!canContinue}
          >
            Save &amp; Continue
          </LoadingButton>
        ) : null}

        {/* <Button variant="outlined" color="primary" onClick={onSaveExit}>
          Save &amp; Exit
        </Button> */}
      </Box>
    </Container>
  </Box>
);

export default PortalFooterBar;
