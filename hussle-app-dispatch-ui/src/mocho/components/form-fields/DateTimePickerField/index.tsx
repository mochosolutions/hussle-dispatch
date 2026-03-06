import React, { useCallback } from 'react';
import { FormHelperText, Stack, InputLabel, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { DateTimePickerFieldProps } from '../types';

/**
 * DateTimePickerField - MUI DateTimePicker wrapped as a form-field.
 *
 * Features:
 * - Full MUI DateTimePicker functionality
 * - Min/max date constraints
 * - Helper text support
 * - Full Formik integration
 *
 * Note: Must be wrapped in LocalizationProvider by parent component
 */
export const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  name,
  label,
  required = false,
  helperText,
  minDate,
  maxDate,
  formik,
}) => {
  const value = (formik.values[name] as Date | null) || null;
  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;
  const hasError = Boolean(touched && error);

  const handleChange = useCallback(
    (newValue: Date | null) => {
      formik.setFieldValue(name, newValue);
    },
    [formik, name]
  );

  return (
    <Stack spacing={1}>
      <InputLabel htmlFor={name} required={required}>
        {label}
      </InputLabel>
      <DateTimePicker
        value={value}
        onChange={handleChange}
        minDate={minDate}
        maxDate={maxDate}
        slotProps={{
          textField: {
            id: name,
            name,
            fullWidth: true,
            error: hasError,
            onBlur: formik.handleBlur,
          },
        }}
      />
      {hasError && <FormHelperText error>{error}</FormHelperText>}
      {helperText && !hasError && <FormHelperText>{helperText}</FormHelperText>}
    </Stack>
  );
};
