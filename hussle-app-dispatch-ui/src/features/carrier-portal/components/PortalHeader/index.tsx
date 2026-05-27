import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

import { BrandName, Meta } from 'components/Typography';
import config from '../../../../config';

interface PortalHeaderProps {
  brandSubtitle?: string;
  rightSlot?: ReactNode;
}

const SecureBadge: React.FC = () => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      bgcolor: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      color: 'common.white',
      px: 1.25,
      py: 0.5,
      borderRadius: 999,
    }}
  >
    <LockOutlined sx={{ fontSize: 14, color: 'secondary.light' }} />
    <Meta sx={{ color: 'common.white', opacity: 0.85 }}>Secure connection</Meta>
  </Box>
);

const PortalLogo: React.FC = () => (
  <Box
    sx={{
      width: 28,
      height: 28,
      borderRadius: 1,
      background: (theme) =>
        `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'common.white',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: 1,
    }}
  >
    F
  </Box>
);

const PortalHeader: React.FC<PortalHeaderProps> = ({
  brandSubtitle = 'Carrier onboarding',
  rightSlot,
}) => {
  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'primary.dark',
        color: 'common.white',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <PortalLogo />
          <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <BrandName sx={{ fontSize: 14, color: 'common.white' }}>{config.appName}</BrandName>
            <Meta sx={{ color: 'common.white', opacity: 0.65, fontSize: 11 }}>
              {brandSubtitle}
            </Meta>
          </Box>
        </Box>
        {rightSlot ?? <SecureBadge />}
      </Container>
    </Box>
  );
};

export default PortalHeader;
