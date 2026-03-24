import React from 'react';
import { OutlinedInput } from '@mui/material';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { TextFieldProps } from '../types';

/**
 * TextField - Generic text/number input field with validation and error handling.
 *
 * Features:
 * - Supports text and number input types
 * - Uses BaseFieldWrapper for consistent layout
 * - Full Formik integration
 */
export const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  placeholder,
  disabled = false,
  required = false,
  type = 'text',
  autoComplete,
  formik,
}) => {
  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
    >
      <OutlinedInput
        id={name}
        name={name}
        type={type}
        value={formik.values[name] || ''}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        fullWidth
        error={Boolean(touched && error)}
      />
    </BaseFieldWrapper>
  );
};
