import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import { CheckCircleOutline, DownloadOutlined } from '@mui/icons-material';

import { Body, BodyStrong } from 'components/Typography';

export interface AgreementsCompleteBannerProps {
  title?: string;
  subtitle?: ReactNode;
  onDownloadAll?: () => void;
}

const AgreementsCompleteBanner: React.FC<AgreementsCompleteBannerProps> = ({
  title = 'All required documents signed.',
  subtitle,
  onDownloadAll,
}) => (
  <Box
    role="status"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      px: 2.5,
      py: 2.25,
      background: 'linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 50%, #fff 100%)',
      border: '1px solid',
      borderColor: 'rgba(187, 247, 208, 1)',
      borderLeft: '3px solid',
      borderLeftColor: 'success.main',
      borderRadius: 0.75,
      mb: 2.25,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        bgcolor: 'success.main',
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        '& svg': { fontSize: 24 },
      }}
    >
      <CheckCircleOutline />
    </Box>
    <Box sx={{ flex: 1, lineHeight: 1.4 }}>
      <BodyStrong sx={{ fontSize: 16, fontWeight: 700, color: 'rgba(6, 78, 59, 1)', mb: 0.25 }}>
        {title}
      </BodyStrong>
      {subtitle ? (
        <Body sx={{ fontSize: 13, color: 'rgba(20, 83, 45, 1)' }}>{subtitle}</Body>
      ) : null}
    </Box>
    {onDownloadAll ? (
      <Button
        variant="contained"
        onClick={onDownloadAll}
        startIcon={<DownloadOutlined sx={{ fontSize: 14 }} />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 13,
          bgcolor: 'success.main',
          color: 'common.white',
          px: 1.75,
          py: 1.125,
          borderRadius: 0.75,
          flexShrink: 0,
          '&:hover': { bgcolor: 'success.dark' },
        }}
      >
        Download all (.zip)
      </Button>
    ) : null}
  </Box>
);

export default AgreementsCompleteBanner;
