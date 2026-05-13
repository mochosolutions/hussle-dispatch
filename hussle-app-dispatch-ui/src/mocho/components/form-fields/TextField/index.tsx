import React from 'react';
import { InputAdornment, OutlinedInput, Typography } from '@mui/material';
import { getIn } from 'formik';
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
  multiline = false,
  minRows,
  startAdornment,
  endAdornment,
  formik,
  ...rest
}) => {
  const error = getIn(formik.errors, name) as string | undefined;
  const touched = getIn(formik.touched, name) as boolean | undefined;

  const renderAdornment = (text: string, position: 'start' | 'end') => (
    <InputAdornment position={position}>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {text}
      </Typography>
    </InputAdornment>
  );

  return (
    <BaseFieldWrapper name={name} label={label} required={required} error={error} touched={touched}>
      <OutlinedInput
        id={name}
        name={name}
        type={type}
        value={getIn(formik.values, name) || ''}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        multiline={multiline}
        minRows={minRows}
        fullWidth
        error={Boolean(touched && error)}
        startAdornment={startAdornment ? renderAdornment(startAdornment, 'start') : undefined}
        endAdornment={endAdornment ? renderAdornment(endAdornment, 'end') : undefined}
        {...rest}
      />
    </BaseFieldWrapper>
  );
};
