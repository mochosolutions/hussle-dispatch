import React from 'react';
import { Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { FormLinkProps } from '../types';

/**
 * FormLink - Router link with consistent styling.
 *
 * Features:
 * - MUI Link + React Router Link integration
 * - Configurable variant and styling
 * - Optional underline
 */
export const FormLink: React.FC<FormLinkProps> = ({
  label,
  to,
  variant = 'h6',
  underline = false,
  color,
}) => {
  return (
    <Link
      variant={variant}
      component={RouterLink}
      to={to}
      color={color}
      sx={{
        textDecoration: underline ? 'underline' : 'none',
      }}
    >
      {label}
    </Link>
  );
};
