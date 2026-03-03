import React from 'react';
import { OutlinedInput } from '@mui/material';
import { BaseFieldWrapper } from '../BaseFieldWrapper';
import type { DateFieldProps } from '../types';

export const DateField: React.FC<DateFieldProps> = ({
  name,
  label,
  disabled = false,
  required = false,
  formik,
}) => {
  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;

  return (
    <BaseFieldWrapper
      error={error}
      label={label}
      name={name}
      required={required}
      touched={touched}
    >
      <OutlinedInput
        disabled={disabled}
        error={Boolean(touched && error)}
        fullWidth
        id={name}
        name={name}
        notched
        onBlur={formik.handleBlur}
        onChange={formik.handleChange}
        type="date"
        value={formik.values[name] || ''}
      />
    </BaseFieldWrapper>
  );
};
