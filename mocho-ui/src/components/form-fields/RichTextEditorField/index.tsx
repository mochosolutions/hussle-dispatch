import React, { useCallback } from 'react';
import { Stack, InputLabel } from '@mui/material';
import TiptapEditor from '../../TiptapEditor';
import type { RichTextEditorFieldProps } from '../types';

/**
 * RichTextEditorField - TiptapEditor wrapped as a form-field with Formik integration.
 *
 * Features:
 * - Full TiptapEditor functionality (formatting, links, images)
 * - Error state handling with helper text
 * - Inline image selection support (deferred upload)
 * - Full Formik integration
 */
export const RichTextEditorField: React.FC<RichTextEditorFieldProps> = ({
  name,
  label,
  required = false,
  placeholder,
  minHeight = 400,
  maxHeight = 600,
  onImageSelect,
  formik,
}) => {
  const value = (formik.values[name] as string) || '';
  const error = formik.errors[name] as string | undefined;
  const touched = formik.touched[name] as boolean | undefined;
  const hasError = Boolean(touched && error);

  const handleChange = useCallback(
    (html: string) => {
      formik.setFieldValue(name, html);
    },
    [formik, name]
  );

  return (
    <Stack spacing={1}>
      <InputLabel required={required}>{label}</InputLabel>
      <TiptapEditor
        value={value}
        onChange={handleChange}
        onImageSelect={onImageSelect}
        placeholder={placeholder}
        minHeight={minHeight}
        maxHeight={maxHeight}
        error={hasError}
        helperText={hasError ? error : undefined}
      />
    </Stack>
  );
};
