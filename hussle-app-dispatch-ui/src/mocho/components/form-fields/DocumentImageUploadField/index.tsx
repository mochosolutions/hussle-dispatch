import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Stack,
  Button,
  Typography,
  FormHelperText,
  InputLabel,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { validateImageBeforeUpload, ImageUploadError } from '../../../utils/imageUploadErrors';
import { useDocumentUpload, UploadState } from '../../../hooks/useDocumentUpload';
import type { DocumentCategory } from '../../../types/documents';
import type { FormikFieldProps } from '../types';

/**
 * Props for DocumentImageUploadField
 */
export interface DocumentImageUploadFieldProps {
  /** Field name for document ID in Formik */
  name: string;
  /** Field name for storing the preview URL */
  urlFieldName?: string;
  /** Field label */
  label: string;
  /** Document category */
  category: DocumentCategory;
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
 * Get status message for upload state
 */
function getStatusMessage(state: UploadState, progress: number): string {
  switch (state) {
    case 'requesting':
      return 'Preparing upload...';
    case 'uploading':
      return `Uploading... ${progress}%`;
    case 'processing':
      return 'Processing image...';
    case 'complete':
      return 'Upload complete';
    case 'error':
      return 'Upload failed';
    default:
      return '';
  }
}

/**
 * DocumentImageUploadField - File upload using presigned URLs with processing status.
 *
 * Features:
 * - Presigned URL upload (bypasses API for file transfer)
 * - Real-time upload progress
 * - Processing status polling
 * - Preview with processed image variants
 * - Client-side validation
 * - Automatic cleanup on cancel/error
 */
export const DocumentImageUploadField: React.FC<DocumentImageUploadFieldProps> = ({
  name,
  urlFieldName,
  label,
  category,
  accept = 'image/*',
  maxSizeMB = 10,
  previewHeight = 200,
  helperText,
  formik,
}) => {
  // Get existing values
  const existingDocumentId = formik.values[name] as string | null;
  const existingUrl = urlFieldName ? (formik.values[urlFieldName] as string | null) : null;

  // Local state
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl);
  const [validationError, setValidationError] = useState<ImageUploadError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document upload hook
  const {
    state,
    progress,
    error: uploadError,
    result,
    upload,
    cancel,
    reset,
  } = useDocumentUpload({
    category,
    onComplete: (uploadResult) => {
      // Store document ID in Formik
      formik.setFieldValue(name, uploadResult.documentId);

      // Store preview URL if urlFieldName provided
      if (urlFieldName) {
        formik.setFieldValue(urlFieldName, uploadResult.variants.medium || uploadResult.variants.original);
      }

      // Update preview to use processed image
      setPreviewUrl(uploadResult.variants.medium || uploadResult.variants.original);
    },
    onError: (_err) => {
      // Error state is tracked by the useDocumentUpload hook
    },
  });

  // Update preview when existing URL changes (edit mode)
  useEffect(() => {
    if (existingUrl && !previewUrl) {
      setPreviewUrl(existingUrl);
    }
  }, [existingUrl, previewUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any in-progress upload
      if (state !== 'idle' && state !== 'complete') {
        cancel();
      }
    };
  }, [state, cancel]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Create temporary preview with blob URL
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);

      // Start upload
      try {
        await upload(file);
        // Preview will be updated to CDN URL in onComplete callback
      } catch {
        // Error handled by hook
      } finally {
        // Revoke blob URL (preview now uses CDN URL or was cleared on error)
        URL.revokeObjectURL(blobUrl);
      }
    },
    [upload, maxSizeMB]
  );

  const handleRemove = useCallback(async () => {
    // Cancel any in-progress upload
    if (state !== 'idle' && state !== 'complete') {
      await cancel();
    }

    // Reset hook state
    reset();

    // Clear preview
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
  }, [state, cancel, reset, formik, name, urlFieldName]);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isUploading = state === 'requesting' || state === 'uploading' || state === 'processing';
  const hasError = validationError || uploadError;

  let borderColor = 'divider';
  if (hasError) {
    borderColor = 'error.main';
  } else if (state === 'complete') {
    borderColor = 'success.main';
  }

  return (
    <Stack spacing={1}>
      <InputLabel>{label}</InputLabel>

      {/* Preview Area */}
      <Box
        sx={{
          border: 1,
          borderColor,
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
              opacity: isUploading ? 0.5 : 1,
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

        {/* Upload complete indicator */}
        {state === 'complete' && (
          <CheckCircleIcon
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'success.main',
            }}
          />
        )}
      </Box>

      {/* Progress bar */}
      {isUploading && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant={state === 'uploading' ? 'determinate' : 'indeterminate'}
            value={state === 'uploading' ? progress : undefined}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {getStatusMessage(state, progress)}
          </Typography>
        </Box>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Validation error */}
      {validationError && (
        <FormHelperText error>{validationError.message}</FormHelperText>
      )}

      {/* Upload error */}
      {uploadError && (
        <Alert severity="error" sx={{ py: 0.5 }}>
          {uploadError}
        </Alert>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          onClick={handleSelectClick}
          startIcon={<UploadIcon />}
          disabled={isUploading}
          fullWidth
        >
          {isUploading ? 'Uploading...' : 'Select Image'}
        </Button>
        {(previewUrl || isUploading) && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleRemove}
            startIcon={<DeleteIcon />}
            disabled={false}
          >
            {isUploading ? 'Cancel' : 'Remove'}
          </Button>
        )}
      </Stack>

      {/* Helper text */}
      {helperText && !hasError && <FormHelperText>{helperText}</FormHelperText>}
    </Stack>
  );
};

export default DocumentImageUploadField;
