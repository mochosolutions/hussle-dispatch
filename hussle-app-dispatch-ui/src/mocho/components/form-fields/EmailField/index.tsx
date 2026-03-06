import React from 'react';
import { OutlinedInput } from '@mui/material';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { EmailFieldProps } from '../types';

/**
 * EmailField - Email input field with validation and error handling.
 *
 * Features:
 * - type="email" for browser validation
 * - Uses BaseFieldWrapper for consistent layout
 * - Full Formik integration
 * - Default placeholder
 */
export const EmailField: React.FC<EmailFieldProps> = ({
  name,
  label,
  placeholder = 'Enter email address',
  disabled = false,
  required = false,
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
        type="email"
        value={formik.values[name] || ''}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        error={Boolean(touched && error)}
      />
    </BaseFieldWrapper>
  );
};
