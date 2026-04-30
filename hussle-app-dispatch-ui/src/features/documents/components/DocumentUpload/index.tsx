import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Checkbox,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  alpha,
} from '@mui/material';
import {
  CloudUploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import type { SelectChangeEvent } from '@mui/material';

import {
  BodyMedium,
  ErrorText,
  Meta,
  MetaStrong,
  SectionTitle,
  Timestamp,
} from 'components/Typography';

import {
  presignDocument,
  confirmDocument,
  listDocuments,
  bulkDownload,
} from 'utils/api/documents/documentApi';
import type {
  Document,
  DocumentEntityType,
  DocumentMetadata,
  DocumentType,
  UploadStatus,
} from '../../types';
import type { DocumentContext } from '../../constants';
import { DOC_TYPE_CONFIG, DOCUMENT_CONTEXTS } from '../../constants';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;
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

const METADATA_FIELD_LABELS: Record<string, string> = {
  licenseNumber: 'License Number',
  issuingState: 'Issuing State',
  cdlClass: 'CDL Class',
  policyNumber: 'Policy Number',
  issuingAuthority: 'Issuing Authority',
};

export interface DocumentUploadProps {
  context: DocumentContext;
  entityType: DocumentEntityType;
  entityId: string;
  onUploadComplete?: () => void;
}

interface UploadState {
  status: UploadStatus;
  progress: number;
  error: string | null;
  filename: string | null;
  selectedFile: File | null;
}

const INITIAL_UPLOAD_STATE: UploadState = {
  status: 'idle',
  progress: 0,
  error: null,
  filename: null,
  selectedFile: null,
};

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  context,
  entityType,
  entityId,
  onUploadComplete,
}) => {
  const allowedTypes = DOCUMENT_CONTEXTS[context];
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(allowedTypes[0]);
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_UPLOAD_STATE);
  const [isDragOver, setIsDragOver] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const [expiresAt, setExpiresAt] = useState('');
  const [metadata, setMetadata] = useState<DocumentMetadata>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const docTypeConfig = DOC_TYPE_CONFIG[selectedDocType];
  const isCompliance = docTypeConfig.compliance;
  const metadataFields = 'metadataFields' in docTypeConfig ? docTypeConfig.metadataFields : [];

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const result = await listDocuments({ entityType, entityId });
      setDocuments(result.data);
    } catch {
      // Empty list shown on error
    } finally {
      setIsLoadingDocs(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const validateFile = useCallback((file: File): string | null => {
    if (!DEFAULT_ACCEPTED_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not accepted. Accepted: PDF, JPG, PNG, WEBP`;
    }
    if (file.size > DEFAULT_MAX_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum of ${formatFileSize(DEFAULT_MAX_SIZE)}`;
    }
    return null;
  }, []);

  const performUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: validationError,
        filename: file.name,
        selectedFile: null,
      });
      return;
    }

    setUploadState({
      status: 'presigning',
      progress: 0,
      error: null,
      filename: file.name,
      selectedFile: null,
    });

    try {
      const presignInput = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        type: selectedDocType,
        entityType,
        entityId,
        ...(isCompliance && expiresAt ? { expiresAt } : {}),
        ...(isCompliance && Object.keys(metadata).length > 0 ? { metadata } : {}),
      };

      const { presign } = await presignDocument(presignInput);

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

      setUploadState((prev) => ({ ...prev, status: 'confirming', progress: 100 }));

      const confirmInput = {
        ...(isCompliance && expiresAt ? { expiresAt } : {}),
        ...(isCompliance && Object.keys(metadata).length > 0 ? { metadata } : {}),
      };

      const { document: uploaded } = await confirmDocument(
        presign.documentId,
        Object.keys(confirmInput).length > 0 ? confirmInput : undefined,
      );

      setDocuments((prev) => [uploaded, ...prev]);
      setUploadState(INITIAL_UPLOAD_STATE);
      setExpiresAt('');
      setMetadata({});
      onUploadComplete?.();
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
        selectedFile: null,
      });
    }
  }, [
    validateFile,
    selectedDocType,
    entityType,
    entityId,
    isCompliance,
    expiresAt,
    metadata,
    onUploadComplete,
  ]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: validationError,
        filename: file.name,
        selectedFile: null,
      });
      return;
    }

    if (isCompliance) {
      setUploadState({
        status: 'idle',
        progress: 0,
        error: null,
        filename: file.name,
        selectedFile: file,
      });
    } else {
      performUpload(file);
    }
  }, [validateFile, isCompliance, performUpload]);

  const handleConfirmAndUpload = useCallback(() => {
    if (uploadState.selectedFile) {
      performUpload(uploadState.selectedFile);
    }
  }, [uploadState.selectedFile, performUpload]);

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

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRetry = useCallback(() => {
    setUploadState(INITIAL_UPLOAD_STATE);
  }, []);

  const handleDocTypeChange = useCallback((event: SelectChangeEvent<DocumentType>) => {
    setSelectedDocType(event.target.value as DocumentType);
    setExpiresAt('');
    setMetadata({});
    setUploadState(INITIAL_UPLOAD_STATE);
  }, []);

  const handleMetadataChange = useCallback((field: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleToggleDocSelect = useCallback((docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId],
    );
  }, []);

  const handleToggleAllDocs = useCallback(() => {
    if (selectedDocIds.length === documents.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map((doc) => doc.id));
    }
  }, [selectedDocIds.length, documents]);

  const handleBulkDownload = useCallback(async () => {
    if (selectedDocIds.length === 0) {
      return;
    }

    setIsDownloading(true);
    try {
      const result = await bulkDownload(selectedDocIds);
      result.downloads.forEach((download) => {
        window.open(download.presignedUrl, '_blank', 'noopener,noreferrer');
      });
      setSelectedDocIds([]);
    } catch {
      // Download errors handled silently — user can retry
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocIds]);

  const { status, progress, error, filename, selectedFile } = uploadState;

  const isUploading = status === 'presigning' || status === 'uploading' || status === 'confirming';

  return (
    <Stack spacing={3}>
      {/* Document type selector */}
      <Box>
        <SectionTitle sx={{ mb: 1 }}>
          Document Type
        </SectionTitle>
        <Select<DocumentType>
          value={selectedDocType}
          onChange={handleDocTypeChange}
          size="small"
          fullWidth
          disabled={isUploading}
        >
          {allowedTypes.map((docType) => (
            <MenuItem key={docType} value={docType}>
              {DOC_TYPE_CONFIG[docType].label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* File upload area */}
      {status === 'idle' && !selectedFile && (
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          role="button"
          aria-label={`Upload ${DOC_TYPE_CONFIG[selectedDocType].label} document`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleBrowseClick();
            }
          }}
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
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={DEFAULT_ACCEPTED_TYPES.join(',')}
            onChange={handleInputChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
          <CloudUploadOutlined style={{ fontSize: 40, color: '#8c8c8c' }} />
          <BodyMedium sx={{ mt: 1.5 }}>
            Drag & drop a file here, or click to browse
          </BodyMedium>
          <Meta sx={{ mt: 0.5 }}>
            PDF, JPG, PNG, WEBP — Max {formatFileSize(DEFAULT_MAX_SIZE)}
          </Meta>
        </Box>
      )}

      {/* Compliance metadata form — shown after file selection for compliance doc types */}
      {status === 'idle' && selectedFile && isCompliance && (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
          }}
        >
          <MetaStrong sx={{ mb: 2 }}>
            {filename} — Complete details before uploading
          </MetaStrong>

          <Stack spacing={2}>
            <TextField
              label="Expiration Date"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            {metadataFields.map((field) => (
              <TextField
                key={field}
                label={METADATA_FIELD_LABELS[field] ?? field}
                value={(metadata as Record<string, string>)[field] ?? ''}
                onChange={(e) => handleMetadataChange(field, e.target.value)}
                size="small"
                fullWidth
              />
            ))}

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                onClick={handleConfirmAndUpload}
              >
                Upload
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleRetry}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Upload progress */}
      {isUploading && (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
          }}
        >
          <MetaStrong sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {filename}
          </MetaStrong>
          <LinearProgress
            variant={status === 'uploading' ? 'determinate' : 'indeterminate'}
            value={status === 'uploading' ? progress : undefined}
            sx={{ borderRadius: 1, height: 6 }}
          />
          <Meta sx={{ mt: 0.5, display: 'block' }}>
            {status === 'presigning' && 'Preparing upload...'}
            {status === 'uploading' && `Uploading... ${String(progress)}%`}
            {status === 'confirming' && 'Confirming...'}
          </Meta>
        </Box>
      )}

      {/* Error state */}
      {status === 'error' && (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'error.light',
            borderRadius: 2,
            p: 3,
            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.04),
          }}
        >
          <MetaStrong sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {filename}
          </MetaStrong>
          <Box role="alert" sx={{ mt: 0.5 }}>
            <ErrorText sx={{ display: 'block' }}>{error}</ErrorText>
          </Box>
          <Button variant="outlined" size="small" onClick={handleRetry} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Box>
      )}

      {/* Document list */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <SectionTitle>Documents</SectionTitle>
          {selectedDocIds.length > 0 && (
            <Button
              size="small"
              startIcon={<DownloadOutlined />}
              onClick={handleBulkDownload}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : `Download Selected (${String(selectedDocIds.length)})`}
            </Button>
          )}
        </Stack>

        {isLoadingDocs && (
          <Timestamp>
            Loading documents...
          </Timestamp>
        )}

        {!isLoadingDocs && documents.length === 0 && (
          <Timestamp>
            No documents uploaded yet
          </Timestamp>
        )}

        {documents.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedDocIds.length === documents.length && documents.length > 0}
                      indeterminate={
                        selectedDocIds.length > 0 && selectedDocIds.length < documents.length
                      }
                      onChange={handleToggleAllDocs}
                      aria-label="Select all documents"
                    />
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Expires</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selectedDocIds.includes(doc.id)}
                        onChange={() => handleToggleDocSelect(doc.id)}
                        aria-label={`Select ${doc.fileName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <MetaStrong sx={{ fontWeight: 500 }}>
                        {DOC_TYPE_CONFIG[doc.type].label}
                      </MetaStrong>
                    </TableCell>
                    <TableCell>
                      <Meta sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
                        {doc.fileName}
                      </Meta>
                    </TableCell>
                    <TableCell>
                      <Meta>
                        {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                      </Meta>
                    </TableCell>
                    <TableCell>
                      <Meta>
                        {doc.expiresAt
                          ? format(new Date(doc.expiresAt), 'MMM d, yyyy')
                          : ''}
                      </Meta>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
};

export default DocumentUpload;
