import React from 'react';
import { Typography } from '@mui/material';
import type { SecondaryButtonProps } from '../types';

/**
 * SecondaryButton - Text-based secondary action button.
 *
 * Features:
 * - Clickable text with primary color
 * - Configurable variant (text/outlined)
 * - Underline option for outlined variant
 */
export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onClick,
  variant = 'text',
}) => {
  return (
    <Typography
      onClick={onClick}
      variant="body1"
      sx={{
        minWidth: 85,
        ml: 2,
        textDecoration: variant === 'outlined' ? 'underline' : 'none',
        cursor: 'pointer',
      }}
      color="primary"
    >
      {label}
    </Typography>
  );
};
