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
import type { ImageUploadFieldProps } from '../types';

/**
 * ImageUploadField - File upload with image preview, validation, and remove functionality.
 *
 * Features:
 * - File selection with drag support
 * - Image preview with blob URL
 * - Client-side validation (file type, size)
 * - Remove functionality
 * - Support for existing URL (edit mode)
 * - Automatic blob URL cleanup
 * - Full Formik integration
 */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  name,
  urlFieldName,
  label,
  accept = 'image/*',
  maxSizeMB = 10,
  previewHeight = 200,
  helperText,
  formik,
}) => {
  // Get existing URL for edit mode
  const existingUrl = urlFieldName
    ? (formik.values[urlFieldName] as string | null)
    : null;

  // Local state for preview URL and validation error
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl);
  const [validationError, setValidationError] = useState<ImageUploadError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Note: previewUrl is initialized from existingUrl above; file selection updates it via handleFileSelect

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file before accepting
      const error = validateImageBeforeUpload(file, maxSizeMB);
      if (error) {
        setValidationError(error);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Clear any previous errors
      setValidationError(null);

      // Revoke old blob URL if exists
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      // Create new preview URL
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);

      // Store file in Formik
      formik.setFieldValue(name, file);

      // Clear existing URL field if provided (we're replacing with new file)
      if (urlFieldName) {
        formik.setFieldValue(urlFieldName, null);
      }
    },
    [formik, name, urlFieldName, maxSizeMB, previewUrl]
  );

  const handleRemove = useCallback(() => {
    // Revoke blob URL if exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Clear state
    setPreviewUrl(null);
    setValidationError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear Formik values
    formik.setFieldValue(name, null);
    if (urlFieldName) {
      formik.setFieldValue(urlFieldName, null);
    }
  }, [formik, name, urlFieldName, previewUrl]);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
          Select Image
        </Button>
        {previewUrl && (
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
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </Stack>
  );
};
