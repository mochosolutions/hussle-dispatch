import { useState, useRef, useCallback } from 'react';
import { Box, Button, Typography, LinearProgress, Alert } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { DocumentType } from 'features/documents/types';
import {
  presignDocument,
  confirmDocument,
} from 'utils/api/driver-portal/driverPortalApi';

/**
 * Accepted MIME types for portal uploads.
 * Matches the shared DocumentUpload defaults minus WEBP (camera captures produce JPEG/PNG).
 */
const ACCEPTED_TYPES = 'image/jpeg,image/png,application/pdf';
const ACCEPTED_TYPE_LIST = ACCEPTED_TYPES.split(',');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface PortalDocumentUploadProps {
  token: string;
  documentType: DocumentType.BOL_SIGNED | DocumentType.POD;
  label: string;
  sx?: SxProps<Theme>;
}

/**
 * Upload a file to S3 via presigned URL with XHR progress tracking.
 *
 * Reuses the same PUT-to-presigned-URL pattern as the shared DocumentUpload.
 */
const uploadToPresignedUrl = (
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${String(xhr.status)}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.send(file);
  });

/**
 * Lightweight document upload component for the driver portal.
 *
 * The shared DocumentUpload (features/documents) is a full document-management panel
 * (type selector, drag-drop, compliance metadata, document list, bulk download) that
 * uses cookie-based auth. The driver portal requires:
 *   - Token-based auth with different API endpoints
 *   - Single fixed document type per instance (BOL_SIGNED or POD)
 *   - Mobile-optimized UI with camera capture (375 px viewport)
 *   - No document listing or compliance metadata
 *
 * This component reuses the shared DocumentType enum and the same XHR presigned-URL
 * upload pattern, while keeping the portal-specific API integration and mobile UX.
 */
export const PortalDocumentUpload: React.FC<PortalDocumentUploadProps> = ({
  token,
  documentType,
  label,
  sx,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setUploadState('idle');
    setError(null);
    setProgress(0);
    setFileName(null);
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      // Reset the input value immediately so re-selecting the same file
      // (or selecting after an error/size rejection) re-fires onChange.
      // Browsers only fire onChange when the value differs from the prior pick.
      const inputEl = event.target;
      inputEl.value = '';

      if (!file) {
        return;
      }

      if (!ACCEPTED_TYPE_LIST.includes(file.type)) {
        setFileName(file.name);
        setError('Unsupported file type. Please upload a JPEG, PNG, or PDF.');
        setUploadState('error');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setFileName(file.name);
        setError('File is too large. Maximum size is 10 MB.');
        setUploadState('error');
        return;
      }

      setUploadState('uploading');
      setError(null);
      setFileName(file.name);
      setProgress(0);

      try {
        // 1. Get presigned URL via portal token-based API
        const presign = await presignDocument(token, {
          fileName: file.name,
          mimeType: file.type,
          type: documentType,
        });

        setProgress(20);

        // 2. Upload to S3
        await uploadToPresignedUrl(presign.presignedUrl, file, (pct) => {
          setProgress(20 + pct * 60); // 20 % to 80 %
        });

        setProgress(80);

        // 3. Confirm upload
        await confirmDocument(token, presign.documentId);

        setProgress(100);
        setUploadState('success');
      } catch {
        setUploadState('error');
        setError('Upload failed. Please try again.');
      }
    },
    [token, documentType],
  );

  return (
    <Box sx={sx}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>

      {uploadState === 'idle' && (
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            fullWidth
            startIcon={<CameraAltIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ py: 1.5, borderStyle: 'dashed' }}
          >
            Take Photo or Choose File
          </Button>
        </Box>
      )}

      {uploadState === 'uploading' && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Uploading {fileName}...
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, borderRadius: 1 }} />
        </Box>
      )}

      {uploadState === 'success' && (
        <Alert icon={<CheckCircleIcon />} severity="success">
          <Box component="span">{fileName} uploaded successfully.</Box>
          <Button size="small" onClick={handleReset} sx={{ ml: 1 }}>
            Upload Another
          </Button>
        </Alert>
      )}

      {uploadState === 'error' && (
        <Box>
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
          <Button variant="outlined" size="small" onClick={handleReset}>
            Try Again
          </Button>
        </Box>
      )}
    </Box>
  );
};
