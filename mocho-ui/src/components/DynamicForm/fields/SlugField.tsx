import React, { useEffect } from 'react';
import { OutlinedInput } from '@mui/material';
import { SlugFieldConfig } from '../types';
import { getFieldValue } from '../utils';

interface SlugFieldProps<TFormValues extends Record<string, any>> {
  field: SlugFieldConfig;
  values: TFormValues;
  touched: Partial<Record<keyof TFormValues, boolean>>;
  errors: Partial<Record<keyof TFormValues, string>>;
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  handleBlur: React.FocusEventHandler<HTMLInputElement>;
  setFieldValue: <K extends keyof TFormValues>(field: K, value: TFormValues[K]) => void;
}

/**
 * Slug field component with auto-generation from source field
 * Automatically generates URL-friendly slug when source field changes
 * User can still manually edit the slug if needed
 */
export function SlugField<TFormValues extends Record<string, any>>({
  field,
  values,
  touched,
  errors,
  handleChange,
  handleBlur,
  setFieldValue,
}: SlugFieldProps<TFormValues>): JSX.Element {
  const fieldValue = getFieldValue(values, field.name) ?? '';
  const isTouched = getFieldValue(touched, field.name);
  const errorMessage = getFieldValue(errors, field.name);
  const hasError = Boolean(isTouched && errorMessage);

  // Auto-generate slug from source field when it changes
  useEffect(() => {
    // Get the value from the source field (e.g., 'title' or 'name')
    const sourceValue = getFieldValue(values, field.sourceField);

    // Only auto-generate if:
    // 1. Source field has a value
    // 2. Slug field hasn't been manually touched by user
    if (sourceValue && !isTouched) {
      const generatedSlug = field.generator(sourceValue);
      setFieldValue(field.name as keyof TFormValues, generatedSlug as TFormValues[keyof TFormValues]);
    }
  }, [getFieldValue(values, field.sourceField), isTouched, field.generator, field.name, setFieldValue]);

  return (
    <OutlinedInput
      id={field.name}
      name={field.name}
      value={fieldValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={field.placeholder}
      disabled={field.disabled}
      fullWidth
      error={hasError}
    />
  );
}
