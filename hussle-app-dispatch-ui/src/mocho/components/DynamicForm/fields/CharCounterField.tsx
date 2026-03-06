import React from 'react';
import { TextField, FormHelperText } from '@mui/material';
import { CharCounterFieldConfig } from '../types';
import { getFieldValue } from '../utils';

interface CharCounterFieldProps<TFormValues extends Record<string, any>> {
  field: CharCounterFieldConfig;
  values: TFormValues;
  touched: Partial<Record<keyof TFormValues, boolean>>;
  errors: Partial<Record<keyof TFormValues, string>>;
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  handleBlur: React.FocusEventHandler<HTMLInputElement>;
}

/**
 * Textarea field with character counter display
 * Shows current character count vs maximum allowed
 */
export function CharCounterField<TFormValues extends Record<string, any>>({
  field,
  values,
  touched,
  errors,
  handleChange,
  handleBlur,
}: CharCounterFieldProps<TFormValues>): JSX.Element {
  const fieldValue = getFieldValue(values, field.name) ?? '';
  const isTouched = getFieldValue(touched, field.name);
  const errorMessage = getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);

  // Calculate current character count
  const charCount = typeof fieldValue === 'string' ? fieldValue.length : 0;

  return (
    <>
      <TextField
        id={field.name}
        name={field.name}
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={field.placeholder}
        disabled={field.disabled}
        multiline
        rows={field.rows || 4}
        fullWidth
        error={hasError}
        inputProps={{
          maxLength: field.maxLength,
          minLength: field.minLength,
        }}
      />
      {/* Character counter - always visible (not just on error) */}
      <FormHelperText>
        {charCount} / {field.maxLength} characters
      </FormHelperText>
    </>
  );
}
