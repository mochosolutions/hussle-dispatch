import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Stack,
  Button,
  Typography,
  FormHelperText,
  InputLabel,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { validateImageBeforeUpload, ImageUploadError } from '../../../utils/imageUploadErrors';
import type { FormikFieldProps } from '../types';

/**
 * Hero image state stored in form
 */
export interface HeroImageState {
  file: File;
  blobUrl: string;
  filename: string;
}

/**
 * Props for DeferredImageUploadField
 */
export interface DeferredImageUploadFieldProps {
  /** Field name for storing HeroImageState in Formik */
  name: string;
  /** Field name for existing URL (edit mode) */
  existingUrlFieldName?: string;
  /** Field label */
  label: string;
  /** Accepted file types */
  accept?: string;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Preview height in pixels */
  previewHeight?: number;
  /** Helper text */
  helperText?: string;
  /** Formik props */
  formik: FormikFieldProps;
}

/**
 * DeferredImageUploadField - File upload with deferred upload pattern.
 *
 * Features:
 * - Shows blob URL preview immediately (no network request)
 * - Stores file in form state for later upload
 * - Upload happens on form submit via saga
 * - Client-side validation before accepting file
 */
export const DeferredImageUploadField: React.FC<DeferredImageUploadFieldProps> = ({
  name,
  existingUrlFieldName,
  label,
  accept = 'image/*',
  maxSizeMB = 10,
  previewHeight = 200,
  helperText,
  formik,
}) => {
  // Get existing values
  const heroImageState = formik.values[name] as HeroImageState | null;
  const existingUrl = existingUrlFieldName ? (formik.values[existingUrlFieldName] as string | null) : null;

  // Derive preview URL from props — prefer blobUrl from state, fallback to existingUrl
  const previewUrl = heroImageState?.blobUrl ?? existingUrl ?? null;
  const [validationError, setValidationError] = useState<ImageUploadError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (heroImageState?.blobUrl) {
        URL.revokeObjectURL(heroImageState.blobUrl);
      }
    };
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file before accepting
      const error = validateImageBeforeUpload(file, maxSizeMB);
      if (error) {
        setValidationError(error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Clear any previous errors
      setValidationError(null);

      // Revoke previous blob URL if exists
      if (heroImageState?.blobUrl) {
        URL.revokeObjectURL(heroImageState.blobUrl);
      }

      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);

      // Store file in form state (will be uploaded on submit)
      const newHeroImageState: HeroImageState = {
        file,
        blobUrl,
        filename: file.name,
      };

      formik.setFieldValue(name, newHeroImageState);

      // Clear existing URL field if present (we have a new image)
      if (existingUrlFieldName) {
        formik.setFieldValue(existingUrlFieldName, null);
      }
    },
    [formik, name, existingUrlFieldName, heroImageState, maxSizeMB]
  );

  const handleRemove = useCallback(() => {
    // Revoke blob URL if exists
    if (heroImageState?.blobUrl) {
      URL.revokeObjectURL(heroImageState.blobUrl);
    }

    // Clear validation errors
    setValidationError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear Formik values
    formik.setFieldValue(name, null);
    if (existingUrlFieldName) {
      formik.setFieldValue(existingUrlFieldName, null);
    }
  }, [formik, name, existingUrlFieldName, heroImageState]);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasNewImage = !!heroImageState;
  const hasExistingImage = !!existingUrl && !hasNewImage;
  const hasAnyImage = hasNewImage || hasExistingImage;

  return (
    <Stack spacing={1}>
      <InputLabel>{label}</InputLabel>

      {/* Preview Area */}
      <Box
        sx={{
          border: 1,
          borderColor: validationError ? 'error.main' : 'divider',
          borderRadius: 1,
          p: 2,
          textAlign: 'center',
          backgroundColor: 'background.default',
          minHeight: previewHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt="Preview"
            sx={{
              maxWidth: '100%',
              maxHeight: previewHeight,
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />
        ) : (
          <Stack spacing={1} alignItems="center">
            <ImageIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography color="text.secondary" variant="body2">
              No image selected
            </Typography>
          </Stack>
        )}

        {/* New image indicator */}
        {hasNewImage && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'info.main',
              color: 'info.contrastText',
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            New
          </Typography>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Validation error */}
      {validationError && (
        <FormHelperText error>{validationError.message}</FormHelperText>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          onClick={handleSelectClick}
          startIcon={<UploadIcon />}
          fullWidth
        >
          {hasAnyImage ? 'Change Image' : 'Select Image'}
        </Button>
        {hasAnyImage && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleRemove}
            startIcon={<DeleteIcon />}
          >
            Remove
          </Button>
        )}
      </Stack>

      {/* Helper text */}
      {helperText && !validationError && <FormHelperText>{helperText}</FormHelperText>}
    </Stack>
  );
};

export default DeferredImageUploadField;
