import React, { useCallback } from 'react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { getIn } from 'formik';
import type { FormikProps } from 'formik';

/**
 * EmailChipsField — Formik-coupled free-form multi-email input.
 *
 * Accepts free text and commits the current input as a chip on Enter / blur.
 * Backed by MUI Autocomplete with multiple + freeSolo.
 */

export interface EmailChipsFieldProps {
  name: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeEmails = (values: string[]): string[] =>
  values
    .map((v) => v.trim())
    .filter((v, idx, arr) => v.length > 0 && arr.indexOf(v) === idx);

export const EmailChipsField: React.FC<EmailChipsFieldProps> = ({
  name,
  label,
  formik,
  placeholder,
  helperText,
  disabled = false,
}) => {
  const value = (getIn(formik.values, name) as string[] | undefined) ?? [];
  const error = getIn(formik.errors, name);
  const touched = getIn(formik.touched, name) as boolean | undefined;
  const hasError = Boolean(touched && error);
  const errorMessage = typeof error === 'string' ? error : undefined;

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, next: string[]) => {
      const sanitized = sanitizeEmails(next);
      formik.setFieldValue(name, sanitized);
    },
    [formik, name],
  );

  const handleBlur = useCallback(() => {
    formik.setFieldTouched(name, true);
  }, [formik, name]);

  return (
    <Autocomplete
      multiple
      freeSolo
      options={[]}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      renderTags={(values, getTagProps) =>
        values.map((option, index) => {
          const isInvalid = !EMAIL_PATTERN.test(option);
          const tagProps = getTagProps({ index });
          return (
            <Chip
              variant="outlined"
              label={option}
              size="small"
              color={isInvalid ? 'error' : 'default'}
              {...tagProps}
              key={`${option}-${String(index)}`}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={hasError}
          helperText={hasError ? errorMessage : helperText}
        />
      )}
    />
  );
};
