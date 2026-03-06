import React from 'react';
import { Typography } from '@mui/material';
import type { HelperTextProps } from '../types';

/**
 * HelperText - Informational text component.
 *
 * Features:
 * - Simple Typography wrapper
 * - Configurable variant and color
 * - Semantic component name
 */
export const HelperText: React.FC<HelperTextProps> = ({
  text,
  variant = 'caption',
  color,
}) => {
  return (
    <Typography variant={variant} color={color}>
      {text}
    </Typography>
  );
};
