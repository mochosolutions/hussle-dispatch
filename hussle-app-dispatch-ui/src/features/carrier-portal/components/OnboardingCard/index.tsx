import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

import { BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

interface OnboardingCardProps {
  phase: string;
  title: string;
  subtitle?: ReactNode;
  width?: 'md' | 'lg';
  locked?: boolean;
  children: ReactNode;
}

const WIDTH_MAP = {
  md: 640,
  lg: 760,
} as const;

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  phase,
  title,
  subtitle,
  width = 'md',
  locked = false,
  children,
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: WIDTH_MAP[width],
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        p: { xs: 2.5, md: 4 },
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 0.75,
          color: locked ? 'secondary.main' : 'primary.main',
        }}
      >
        {locked ? <LockOutlined sx={{ fontSize: 12 }} /> : null}
        <KpiLabel
          sx={{
            color: 'inherit',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}
        >
          {locked ? `${phase} · locked` : phase}
        </KpiLabel>
      </Box>

      <PageTitle sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, mb: 1 }}>
        {title}
      </PageTitle>

      {subtitle ? (
        <BodyMuted sx={{ fontSize: 14, lineHeight: 1.55, mb: 3 }}>{subtitle}</BodyMuted>
      ) : null}

      {children}
    </Box>
  );
};

export default OnboardingCard;
