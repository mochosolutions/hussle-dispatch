import { useCallback, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, LinearProgress } from '@mui/material';
import { CheckCircleOutline, CloudUploadOutlined } from '@mui/icons-material';

import { BodyStrong, Meta } from 'components/Typography';
import type { DocumentType } from 'features/carrier-portal/types';
import { confirmDocument, presignDocument } from 'utils/api/fleet/carrierPortalApi';

interface DocumentUploadZoneProps {
  documentType: string;
  onUploadComplete: (documentId: string) => void;
  label: string;
  acceptedTypes?: string;
  token: string;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  fileName: string;
  documentId: string;
}

const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === 'object' && error !== null && 'message' in error;

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  documentType,
  onUploadComplete,
  label,
  acceptedTypes = 'application/pdf,image/*',
  token,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadState('uploading');
      setProgress(0);
      setError(null);

      try {
        // Step 1: Get presigned URL
        const presignResponse = await presignDocument(token, {
          fileName: file.name,
          contentType: file.type,
          documentType: documentType as DocumentType,
        });

        setProgress(25);

        // Step 2: Upload to S3
        const xhr = new XMLHttpRequest();

        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const uploadProgress = 25 + (event.loaded / event.total) * 50;
              setProgress(Math.round(uploadProgress));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${String(xhr.status)}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });

          xhr.open('PUT', presignResponse.uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        setProgress(80);

        // Step 3: Confirm upload
        await confirmDocument(token, presignResponse.documentId, {
          documentType: documentType as DocumentType,
        });

        setProgress(100);
        setUploadState('success');
        setUploadResult({ fileName: file.name, documentId: presignResponse.documentId });
        onUploadComplete(presignResponse.documentId);
      } catch (err: unknown) {
        const message = isErrorWithMessage(err) ? err.message : 'Upload failed';
        setError(message);
        setUploadState('error');
      }
    },
    [token, documentType, onUploadComplete],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (uploadState === 'success' && uploadResult) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          border: 1,
          borderColor: 'success.main',
          borderRadius: 1,
          bgcolor: 'success.light',
        }}
      >
        <CheckCircleOutline color="success" />
        <Box>
          <BodyStrong>{label}</BodyStrong>
          <Meta>{uploadResult.fileName}</Meta>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Box
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 4,
          border: '2px dashed',
          borderColor: uploadState === 'error' ? 'error.main' : 'divider',
          borderRadius: 1,
          cursor: uploadState === 'uploading' ? 'default' : 'pointer',
          bgcolor: 'grey.50',
          transition: 'border-color 0.2s',
          '&:hover': {
            borderColor: uploadState === 'uploading' ? 'divider' : 'primary.main',
          },
        }}
      >
        {uploadState === 'uploading' ? (
          <>
            <CircularProgress size={32} />
            <Meta>Uploading...</Meta>
            <Box sx={{ width: '100%', maxWidth: 300 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          </>
        ) : (
          <>
            <CloudUploadOutlined sx={{ fontSize: 40, color: 'text.secondary' }} />
            <BodyStrong>{label}</BodyStrong>
            <Meta>Click or drag file to upload</Meta>
          </>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
