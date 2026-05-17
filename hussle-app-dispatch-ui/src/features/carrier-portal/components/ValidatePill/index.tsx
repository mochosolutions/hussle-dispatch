import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { Check } from '@mui/icons-material';

interface ValidatePillProps {
  children: ReactNode;
  variant?: 'success' | 'error';
}

const ValidatePill: React.FC<ValidatePillProps> = ({ children, variant = 'success' }) => {
  const isError = variant === 'error';
  return (
    <Box
      sx={{
        mt: 1.25,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.625,
        bgcolor: isError ? 'rgba(254, 226, 226, 1)' : 'secondary.lighter',
        color: isError ? 'rgba(127, 29, 29, 1)' : 'rgba(21, 128, 61, 1)',
        px: 1.125,
        py: 0.375,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <Check sx={{ fontSize: 12, color: isError ? 'error.main' : 'secondary.main' }} />
      {children}
    </Box>
  );
};

export default ValidatePill;
