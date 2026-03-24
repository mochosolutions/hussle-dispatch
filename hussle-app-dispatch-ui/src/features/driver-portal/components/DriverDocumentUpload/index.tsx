import { useState, useRef } from 'react';
import { Box, Button, Typography, LinearProgress, Alert } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import {
  presignDocument,
  confirmDocument,
} from 'utils/api/driver-portal/driverPortalApi';

interface DriverDocumentUploadProps {
  token: string;
  documentType: 'BOL_SIGNED' | 'POD';
  label: string;
  sx?: SxProps<Theme>;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

const ACCEPT = 'image/jpeg,image/png,application/pdf';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Upload file to presigned URL with progress tracking
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
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.send(file);
  });

export const DriverDocumentUpload: React.FC<DriverDocumentUploadProps> = ({
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setUploadState('uploading');
    setError(null);
    setFileName(file.name);
    setProgress(0);

    try {
      // 1. Get presigned URL
      const presign = await presignDocument(token, {
        fileName: file.name,
        mimeType: file.type,
        type: documentType,
      });

      setProgress(20);

      // 2. Upload to S3
      await uploadToPresignedUrl(presign.presignedUrl, file, (pct) => {
        setProgress(20 + pct * 0.6); // 20% to 80%
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setUploadState('idle');
    setError(null);
    setProgress(0);
    setFileName(null);
  };

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
            accept={ACCEPT}
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
          {fileName} uploaded successfully
          <Button size="small" onClick={handleRetry} sx={{ ml: 1 }}>
            Upload Another
          </Button>
        </Alert>
      )}

      {uploadState === 'error' && (
        <Box>
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
          <Button variant="outlined" size="small" onClick={handleRetry}>
            Try Again
          </Button>
        </Box>
      )}
    </Box>
  );
};
