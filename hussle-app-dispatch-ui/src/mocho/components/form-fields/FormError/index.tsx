import React from 'react';
import { Grid, FormHelperText } from '@mui/material';
import type { FormErrorProps } from '../types';

/**
 * FormError - Form-level error display component.
 *
 * Features:
 * - Grid item wrapper for consistent layout
 * - Only renders if error exists
 * - Consistent error styling
 */
export const FormError: React.FC<FormErrorProps> = ({ error }) => {
  if (!error) return null;

  return (
    <Grid item xs={12}>
      <FormHelperText error>{error}</FormHelperText>
    </Grid>
  );
};
