import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import { LockOutlined, ArrowForward } from '@mui/icons-material';

import { BodyStrong } from 'components/Typography';

interface LockBannerProps {
  title: string;
  body: ReactNode;
  onRequestChanges?: () => void;
  ctaLabel?: string;
}

const LockBanner: React.FC<LockBannerProps> = ({
  title,
  body,
  onRequestChanges,
  ctaLabel = 'Request changes',
}) => {
  return (
    <Box
      sx={{
        background:
          'linear-gradient(90deg, rgba(22, 163, 74, 0.04), rgba(22, 163, 74, 0.02))',
        border: '1px solid',
        borderColor: 'secondary.light',
        borderLeft: '3px solid',
        borderLeftColor: 'secondary.main',
        borderRadius: 0.75,
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 2,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: 'secondary.main',
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <LockOutlined sx={{ fontSize: 16 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <BodyStrong sx={{ fontSize: 13.5, color: 'rgba(6, 78, 59, 1)', display: 'block', mb: 0.25 }}>
          {title}
        </BodyStrong>
        <Box sx={{ fontSize: 13, color: 'rgba(20, 83, 45, 1)', lineHeight: 1.45 }}>{body}</Box>
      </Box>

      {onRequestChanges ? (
        <Button
          onClick={onRequestChanges}
          endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
          sx={{
            border: '1px solid',
            borderColor: 'rgba(134, 239, 172, 1)',
            color: 'secondary.dark',
            fontSize: 12.5,
            fontWeight: 600,
            textTransform: 'none',
            px: 1.5,
            py: 0.75,
            flexShrink: 0,
            '&:hover': { bgcolor: 'secondary.lighter' },
          }}
        >
          {ctaLabel}
        </Button>
      ) : null}
    </Box>
  );
};

export default LockBanner;
