import { Box, Button, Stack } from '@mui/material';
import { CheckOutlined, LockOutlined, SaveOutlined } from '@mui/icons-material';

import { BodyStrong, Meta } from 'components/Typography';

interface FocusFooterProps {
  primaryNote?: string;
  lockNote?: string;
  onSaveClose?: () => void;
  saveCloseLabel?: string;
  onSignComplete?: () => void;
  signCompleteLabel?: string;
  signCompleteDisabled?: boolean;
}

const FocusFooter: React.FC<FocusFooterProps> = ({
  primaryNote = 'Read fully before signing',
  lockNote,
  onSaveClose,
  saveCloseLabel = 'Save & close',
  onSignComplete,
  signCompleteLabel = 'Sign & complete',
  signCompleteDisabled = false,
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
        py: 1.5,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        boxShadow: '0 -4px 12px rgba(15, 23, 42, 0.04)',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.3 }}>
        <BodyStrong sx={{ fontSize: 13, fontWeight: 600 }}>{primaryNote}</BodyStrong>
        {lockNote ? (
          <Meta
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.625,
              fontSize: 11.5,
              fontWeight: 500,
              mt: 0.25,
              '& svg': { fontSize: 12 },
            }}
          >
            <LockOutlined />
            {lockNote}
          </Meta>
        ) : null}
      </Box>

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ flexShrink: 0, flexWrap: { xs: 'wrap', md: 'nowrap' }, rowGap: 1 }}
      >
        {onSaveClose ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={onSaveClose}
            startIcon={<SaveOutlined sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13.5,
              borderColor: 'grey.200',
              color: 'text.primary',
              px: 2,
              py: 1.125,
              borderRadius: 0.75,
              '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.300' },
            }}
          >
            {saveCloseLabel}
          </Button>
        ) : null}

        <Button
          variant="contained"
          color="primary"
          onClick={onSignComplete}
          disabled={signCompleteDisabled}
          endIcon={<CheckOutlined sx={{ fontSize: 14 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 13.5,
            px: 2,
            py: 1.125,
            borderRadius: 0.75,
          }}
        >
          {signCompleteLabel}
        </Button>
      </Stack>
    </Box>
  );
};

export default FocusFooter;
