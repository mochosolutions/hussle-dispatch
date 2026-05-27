import { Box, IconButton } from '@mui/material';
import { CloseOutlined, ErrorOutline } from '@mui/icons-material';

import { BodyStrong } from 'components/Typography';

export interface AgreementsErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

const AgreementsErrorBanner: React.FC<AgreementsErrorBannerProps> = ({ message, onDismiss }) => (
  <Box
    role="alert"
    sx={{
      mt: 2.5,
      mb: 2,
      bgcolor: 'rgba(254, 226, 226, 1)',
      borderLeft: '3px solid',
      borderLeftColor: 'rgba(220, 38, 38, 1)',
      borderRadius: '0 6px 6px 0',
      px: 2,
      py: 1.75,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.5,
    }}
  >
    <Box sx={{ color: 'rgba(220, 38, 38, 1)', flexShrink: 0, mt: 0.125 }}>
      <ErrorOutline sx={{ fontSize: 18 }} />
    </Box>
    <BodyStrong
      sx={{
        flex: 1,
        fontSize: 13.5,
        lineHeight: 1.5,
        color: 'rgba(127, 29, 29, 1)',
      }}
    >
      {message}
    </BodyStrong>
    {onDismiss ? (
      <IconButton
        size="small"
        aria-label="Dismiss"
        onClick={onDismiss}
        sx={{ color: 'rgba(127, 29, 29, 1)', flexShrink: 0, mt: -0.25 }}
      >
        <CloseOutlined sx={{ fontSize: 16 }} />
      </IconButton>
    ) : null}
  </Box>
);

export default AgreementsErrorBanner;
