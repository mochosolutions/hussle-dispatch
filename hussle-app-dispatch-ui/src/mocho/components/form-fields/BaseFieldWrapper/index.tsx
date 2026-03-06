import React from 'react';
import { Stack, InputLabel, FormHelperText } from '@mui/material';
import type { BaseFieldWrapperProps } from '../types';

/**
 * BaseFieldWrapper - Reusable container for form fields with label and error handling.
 *
 * Provides a consistent layout pattern:
 * - Stack container with spacing
 * - InputLabel with htmlFor and optional required indicator
 * - Children (input component)
 * - Conditional error or helper text display
 */
export const BaseFieldWrapper: React.FC<BaseFieldWrapperProps> = ({
  name,
  label,
  required = false,
  error,
  touched,
  helperText,
  children,
}) => {
  const hasError = Boolean(touched && error);

  return (
    <Stack spacing={1}>
      <InputLabel htmlFor={name} required={required}>
        {label}
      </InputLabel>

      {children}

      {hasError && (
        <FormHelperText error id={`helper-text-${name}`}>
          {error}
        </FormHelperText>
      )}

      {!hasError && helperText && (
        <FormHelperText id={`helper-text-${name}`}>{helperText}</FormHelperText>
      )}
    </Stack>
  );
};
