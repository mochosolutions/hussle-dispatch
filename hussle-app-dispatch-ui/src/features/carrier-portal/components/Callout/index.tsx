import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { ErrorOutline, InfoOutlined, CheckCircleOutline } from '@mui/icons-material';

export type CalloutVariant = 'amber' | 'red' | 'green';

interface CalloutProps {
  variant: CalloutVariant;
  icon?: ReactNode;
  children: ReactNode;
}

const VARIANT_TOKENS: Record<
  CalloutVariant,
  {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    defaultIcon: ReactNode;
  }
> = {
  amber: {
    bg: 'rgba(254, 243, 199, 1)',
    border: 'rgba(217, 119, 6, 1)',
    text: 'rgba(120, 53, 15, 1)',
    iconColor: 'rgba(217, 119, 6, 1)',
    defaultIcon: <InfoOutlined sx={{ fontSize: 20 }} />,
  },
  red: {
    bg: 'rgba(254, 226, 226, 1)',
    border: 'rgba(220, 38, 38, 1)',
    text: 'rgba(127, 29, 29, 1)',
    iconColor: 'rgba(220, 38, 38, 1)',
    defaultIcon: <ErrorOutline sx={{ fontSize: 18 }} />,
  },
  green: {
    bg: 'rgba(220, 252, 231, 1)',
    border: 'rgba(22, 163, 74, 1)',
    text: 'rgba(20, 83, 45, 1)',
    iconColor: 'rgba(22, 163, 74, 1)',
    defaultIcon: <CheckCircleOutline sx={{ fontSize: 20 }} />,
  },
};

const Callout: React.FC<CalloutProps> = ({ variant, icon, children }) => {
  const tokens = VARIANT_TOKENS[variant];

  return (
    <Box
      role={variant === 'red' ? 'alert' : undefined}
      sx={{
        mt: 2.5,
        bgcolor: tokens.bg,
        borderLeft: '3px solid',
        borderLeftColor: tokens.border,
        borderRadius: '0 6px 6px 0',
        px: 2,
        py: 1.75,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
      }}
    >
      <Box sx={{ color: tokens.iconColor, flexShrink: 0, mt: 0.125 }}>
        {icon ?? tokens.defaultIcon}
      </Box>
      <Box
        sx={{
          fontSize: 13.5,
          lineHeight: 1.5,
          color: tokens.text,
          '& strong': { fontWeight: 700, color: tokens.text },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Callout;
