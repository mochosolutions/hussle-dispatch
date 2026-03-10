import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  IconButton,
  alpha,
} from '@mui/material';
import {
  CloudUploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { Document, DocumentType, UploadStatus } from '../../types';
import { presignDocument, confirmDocument } from 'utils/api/documents/documentApi';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${String(Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface UploadState {
  status: UploadStatus;
  progress: number;
  error: string | null;
  filename: string | null;
}

const INITIAL_UPLOAD_STATE: UploadState = {
  status: 'idle',
  progress: 0,
  error: null,
  filename: null,
};

export interface DocumentUploadProps {
  /** Load ID to associate the document with */
  loadId?: string;
  /** Carrier ID to associate the document with */
  carrierId?: string;
  /** Document type classification */
  documentType: DocumentType;
  /** Callback fired when upload completes successfully */
  onUploadComplete: (document: Document) => void;
  /** Accepted MIME types (defaults to PDF + common image formats) */
  acceptedTypes?: string[];
  /** Maximum file size in bytes (defaults to 10 MB) */
  maxSize?: number;
}

/**
 * DocumentUpload provides a drag-and-drop file upload zone that handles
 * the full presigned-URL upload flow: presign -> upload to storage -> confirm.
 */
export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  loadId,
  carrierId,
  documentType,
  onUploadComplete,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_UPLOAD_STATE);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const formatAcceptedTypes = useCallback(
    (): string =>
      acceptedTypes
        .map((type) => {
          const ext = type.split('/')[1];
          if (ext === 'jpeg') {
            return 'JPG';
          }
          return ext?.toUpperCase() ?? type;
        })
        .join(', '),
    [acceptedTypes],
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `File type "${file.type}" is not accepted. Accepted types: ${formatAcceptedTypes()}`;
      }
      if (file.size > maxSize) {
        return `File size (${formatFileSize(file.size)}) exceeds maximum of ${formatFileSize(maxSize)}`;
      }
      return null;
    },
    [acceptedTypes, formatAcceptedTypes, maxSize],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      // Validate
      const validationError = validateFile(file);
      if (validationError) {
        setUploadState({
          status: 'error',
          progress: 0,
          error: validationError,
          filename: file.name,
        });
        return;
      }

      setUploadState({
        status: 'presigning',
        progress: 0,
        error: null,
        filename: file.name,
      });

      try {
        // Step 1: Get presigned URL
        const { presign } = await presignDocument({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          documentType,
          loadId,
          carrierId,
        });

        // Step 2: Upload to presigned URL with progress tracking
        setUploadState((prev) => ({ ...prev, status: 'uploading' }));

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadState((prev) => ({ ...prev, progress: percentComplete }));
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
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
          });

          xhr.open('PUT', presign.presignedUrl, true);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        xhrRef.current = null;

        // Step 3: Confirm upload
        setUploadState((prev) => ({ ...prev, status: 'confirming', progress: 100 }));

        const { document } = await confirmDocument(presign.documentId);

        setUploadState({
          status: 'complete',
          progress: 100,
          error: null,
          filename: file.name,
        });

        onUploadComplete(document);
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Upload cancelled') {
          setUploadState(INITIAL_UPLOAD_STATE);
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';

        setUploadState({
          status: 'error',
          progress: 0,
          error: errorMessage,
          filename: file.name,
        });
      }
    },
    [validateFile, carrierId, documentType, loadId, onUploadComplete],
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      handleFileSelect(event.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(event.target.files);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect],
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRetry = useCallback(() => {
    setUploadState(INITIAL_UPLOAD_STATE);
  }, []);

  const handleCancel = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setUploadState(INITIAL_UPLOAD_STATE);
  }, []);

  const { status, progress, error, filename } = uploadState;

  // Idle state: drop zone
  if (status === 'idle') {
    return (
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragOver
            ? (theme) => alpha(theme.palette.primary.main, 0.04)
            : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.light',
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
          },
        }}
        onClick={handleBrowseClick}
        role="button"
        aria-label={`Upload ${documentType} document`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleBrowseClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        <CloudUploadOutlined style={{ fontSize: 40, color: '#8c8c8c' }} />
        <Typography variant="body1" sx={{ mt: 1.5, fontWeight: 500 }}>
          Drag & drop a file here, or click to browse
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {formatAcceptedTypes()} — Max {formatFileSize(maxSize)}
        </Typography>
      </Box>
    );
  }

  // Uploading / presigning / confirming state: progress bar
  if (status === 'presigning' || status === 'uploading' || status === 'confirming') {
    let statusLabel = `Uploading... ${String(progress)}%`;
    if (status === 'presigning') {
      statusLabel = 'Preparing upload...';
    } else if (status === 'confirming') {
      statusLabel = 'Confirming...';
    }

    return (
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {filename}
          </Typography>
          <IconButton
            size="small"
            onClick={handleCancel}
            aria-label="Cancel upload"
            sx={{ ml: 1 }}
          >
            <DeleteOutlined />
          </IconButton>
        </Box>
        <LinearProgress
          variant={status === 'uploading' ? 'determinate' : 'indeterminate'}
          value={status === 'uploading' ? progress : undefined}
          sx={{ borderRadius: 1, height: 6 }}
        />
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
          {statusLabel}
        </Typography>
      </Box>
    );
  }

  // Success state
  if (status === 'complete') {
    return (
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'success.light',
          borderRadius: 2,
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          backgroundColor: (theme) => alpha(theme.palette.success.main, 0.04),
        }}
      >
        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {filename}
          </Typography>
          <Typography variant="caption" sx={{ color: 'success.main' }}>
            Upload complete
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleRetry}
          aria-label="Upload another file"
        >
          <DeleteOutlined />
        </IconButton>
      </Box>
    );
  }

  // Error state
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'error.light',
        borderRadius: 2,
        p: 3,
        backgroundColor: (theme) => alpha(theme.palette.error.main, 0.04),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f', marginTop: 2 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {filename}
          </Typography>
          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
            {error}
          </Typography>
        </Box>
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={handleRetry}
        sx={{ mt: 2 }}
      >
        Try Again
      </Button>
    </Box>
  );
};
