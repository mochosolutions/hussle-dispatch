import React from 'react';
import { TextField, FormHelperText } from '@mui/material';
import { getIn } from 'formik';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { CharCounterFieldProps } from '../types';

/**
 * CharCounterField - Multiline textarea with character counter display.
 *
 * Features:
 * - Multiline textarea input
 * - Real-time character count display
 * - Uses BaseFieldWrapper for consistent layout
 * - Full Formik integration
 */
export const CharCounterField: React.FC<CharCounterFieldProps> = ({
  name,
  label,
  maxLength,
  rows = 4,
  placeholder,
  disabled = false,
  required = false,
  formik,
}) => {
  const value = (getIn(formik.values, name) as string) || '';
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const charCount = value.length;

  return (
    <BaseFieldWrapper
      name={name}
      label={label}
      required={required}
      error={error}
      touched={touched}
    >
      <TextField
        id={name}
        name={name}
        value={value}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        multiline
        rows={rows}
        fullWidth
        error={Boolean(touched && error)}
        inputProps={{
          maxLength,
        }}
      />
      <FormHelperText>
        {charCount}/{maxLength} characters
      </FormHelperText>
    </BaseFieldWrapper>
  );
};
