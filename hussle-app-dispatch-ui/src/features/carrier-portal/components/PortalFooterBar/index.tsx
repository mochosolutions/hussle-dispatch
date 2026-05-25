import { Container, Box, Button, CircularProgress, Stack } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

import { BodyStrong, Meta } from 'components/Typography';

interface PortalFooterSecondaryAction {
  label: string;
  onClick?: () => void;
}

interface PortalFooterBarProps {
  phaseLabel: string;
  metaText?: string;
  helperText?: string;
  onBack?: () => void;
  backLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isContinuing?: boolean;
  secondaryAction?: PortalFooterSecondaryAction;
}

const PortalFooterBar: React.FC<PortalFooterBarProps> = ({
  phaseLabel,
  metaText,
  helperText,
  onBack,
  backLabel = 'Back',
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  isContinuing = false,
  secondaryAction,
}) => {
  return (
    <Box
      component="footer"
      sx={{
        position: 'sticky',
        bottom: 0,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'grey.200',
        py: 1.75,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        boxShadow: '0 -4px 12px rgba(15, 23, 42, 0.04)',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <BodyStrong sx={{ fontSize: 13 }}>{phaseLabel}</BodyStrong>
          {metaText ? <Meta sx={{ fontSize: 11.5, mt: 0.25 }}>{metaText}</Meta> : null}
        </Box>

        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ flexShrink: 0, flexWrap: { xs: 'wrap', md: 'nowrap' }, rowGap: 1 }}
        >
          {/* {helperText ? (
            <Meta sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
              {helperText}
            </Meta>
          ) : null} */}

          {/* {secondaryAction ? (
            <Button
              variant="text"
              color="inherit"
              onClick={secondaryAction.onClick}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 13.5,
                color: 'text.secondary',
                px: 1.5,
                py: 1.25,
                borderRadius: 0.75,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
              }}
            >
              {secondaryAction.label}
            </Button>
          ) : null} */}

          {onBack ? (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onBack}
              startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                borderColor: 'grey.200',
                color: 'text.primary',
                px: 2.25,
                py: 1.25,
                borderRadius: 0.75,
                '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.300' },
              }}
            >
              {backLabel}
            </Button>
          ) : null}

          {onContinue ? (
            <Button
              variant="contained"
              color="primary"
              onClick={onContinue}
              disabled={continueDisabled || isContinuing}
              endIcon={
                isContinuing ? (
                  <CircularProgress size={14} sx={{ color: 'common.white' }} />
                ) : (
                  <ArrowForward sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                px: 2.25,
                py: 1.25,
                borderRadius: 0.75,
              }}
            >
              {continueLabel}
            </Button>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
};

export default PortalFooterBar;
