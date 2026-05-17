import type { ReactNode } from 'react';
import { Box } from '@mui/material';

import { KpiLabel } from 'components/Typography';

interface RevealSectionProps {
  label: string;
  badge?: string;
  children: ReactNode;
  variant?: 'primary' | 'success';
}

const VARIANT_TOKENS = {
  primary: {
    borderColor: 'primary.main',
    labelColor: 'primary.main',
    gradientFrom: 'rgba(37, 99, 235, 0.04)',
  },
  success: {
    borderColor: 'secondary.main',
    labelColor: 'secondary.main',
    gradientFrom: 'rgba(22, 163, 74, 0.04)',
  },
} as const;

const RevealSection: React.FC<RevealSectionProps> = ({
  label,
  badge,
  children,
  variant = 'primary',
}) => {
  const tokens = VARIANT_TOKENS[variant];

  return (
    <Box
      sx={{
        mt: 2.5,
        borderLeft: '3px solid',
        borderColor: tokens.borderColor,
        background: `linear-gradient(90deg, ${tokens.gradientFrom}, transparent 60%)`,
        borderRadius: '0 6px 6px 0',
        px: 2.25,
        pt: 2,
        pb: 2.25,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.25,
          flexWrap: 'wrap',
        }}
      >
        <KpiLabel
          sx={{
            color: tokens.labelColor,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}
        >
          {label}
        </KpiLabel>
        {badge ? (
          <Box
            component="span"
            sx={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'text.secondary',
              bgcolor: 'grey.100',
              px: 0.75,
              py: 0.125,
              borderRadius: 0.5,
            }}
          >
            {badge}
          </Box>
        ) : null}
      </Box>

      {children}
    </Box>
  );
};

export default RevealSection;
