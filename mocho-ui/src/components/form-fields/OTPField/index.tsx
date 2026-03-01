import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Stack, InputLabel } from '@mui/material';
import OtpInput from 'react18-input-otp';
import { ThemeMode } from '../../../types/config';
import type { OTPFieldProps } from '../types';

/**
 * OTPField - One-time password input field.
 *
 * Features:
 * - Multiple digit inputs using react18-input-otp
 * - Theme-aware styling
 * - Custom focus/hover states
 * - Configurable number of digits
 * - Does NOT use BaseFieldWrapper (special layout)
 */
export const OTPField: React.FC<OTPFieldProps> = ({
  name,
  label,
  numDigits = 6,
  formik,
}) => {
  const theme = useTheme();

  const borderColor =
    theme.palette.mode === ThemeMode.DARK
      ? theme.palette.grey[200]
      : theme.palette.grey[300];

  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;

  return (
    <Stack spacing={1}>
      {label && <InputLabel>{label}</InputLabel>}

      <OtpInput
        value={(formik.values[name] as string) || ''}
        onChange={(otp: string) => formik.setFieldValue(name, otp)}
        numInputs={numDigits}
        containerStyle={{ justifyContent: 'space-between' }}
        inputStyle={{
          width: '100%',
          margin: '8px',
          padding: '10px',
          border: `1px solid ${borderColor}`,
          borderRadius: 4,
        }}
        focusStyle={{
          outline: 'none',
          boxShadow: theme.customShadows?.primary,
          border: `1px solid ${theme.palette.primary.main}`,
        }}
      />

      {touched && error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Stack>
  );
};
