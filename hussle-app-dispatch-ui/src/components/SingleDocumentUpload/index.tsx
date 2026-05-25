import { useCallback, useRef, useState } from 'react';
import { Box, Button, IconButton, LinearProgress, Stack } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { ErrorText, Meta } from 'components/Typography';
import { ComplianceForm } from 'components/ComplianceForm';
import { DOC_TYPE_CONFIG } from 'features/documents/constants';
import type { DocumentType } from 'features/documents/types';

const ACCEPT_DEFAULT = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_FILE_SIZE_DEFAULT = 10 * 1024 * 1024;

export interface SingleDocumentUploadProps {
  documentType: DocumentType;
  accept?: string;
  maxFileSize?: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  fileName?: string;
  onUpload: (file: File, expiresAt: string, metadata: Record<string, string>) => void;
  onReset: () => void;
}

const parseAcceptExtensions = (accept: string): string[] =>
  accept
    .split(',')
    .map((ext) => ext.trim().toLowerCase())
    .filter((ext) => ext.length > 0);

const getFileExtension = (fileName: string): string => {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
};

export const SingleDocumentUpload: React.FC<SingleDocumentUploadProps> = ({
  documentType,
  accept = ACCEPT_DEFAULT,
  maxFileSize = MAX_FILE_SIZE_DEFAULT,
  status,
  errorMessage,
  fileName,
  onUpload,
  onReset,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isCompliance = DOC_TYPE_CONFIG[documentType].compliance === true;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      if (file.size > maxFileSize) {
        setLocalError(`File exceeds ${Math.round(maxFileSize / 1024 / 1024)} MB`);
        e.target.value = '';
        return;
      }
      const allowedExts = parseAcceptExtensions(accept);
      const ext = getFileExtension(file.name);
      if (!allowedExts.includes(ext)) {
        setLocalError('File type not allowed');
        e.target.value = '';
        return;
      }
      e.target.value = '';
      if (isCompliance) {
        setPickedFile(file);
        return;
      }
      onUpload(file, '', {});
    },
    [accept, isCompliance, maxFileSize, onUpload],
  );

  const handleComplianceSubmit = useCallback(
    (expiresAt: string, metadata: Record<string, string>) => {
      if (!pickedFile) {
        return;
      }
      onUpload(pickedFile, expiresAt, metadata);
      setPickedFile(null);
    },
    [onUpload, pickedFile],
  );

  const handleComplianceCancel = useCallback(() => {
    setPickedFile(null);
    onReset();
  }, [onReset]);

  const handleLocalErrorRetry = useCallback(() => {
    setLocalError(null);
    setPickedFile(null);
  }, []);

  const handleParentErrorRetry = useCallback(() => {
    setPickedFile(null);
    onReset();
  }, [onReset]);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  if (localError !== null) {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 1.5, py: 1, borderRadius: 1, backgroundColor: 'background.paper' }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 20, color: 'error.main' }} />
        <ErrorText sx={{ flex: 1 }}>{localError}</ErrorText>
        <IconButton
          size="small"
          aria-label="Clear error and retry"
          onClick={handleLocalErrorRetry}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
    );
  }

  if (status === 'uploading') {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 1.5, py: 1, borderRadius: 1, backgroundColor: 'background.paper' }}
      >
        <LinearProgress sx={{ width: 24, height: 4, borderRadius: 1, flexShrink: 0 }} />
        <Meta
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'text.primary',
          }}
        >
          {fileName}
        </Meta>
      </Stack>
    );
  }

  if (status === 'success') {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 1.5, py: 1, borderRadius: 1, backgroundColor: 'background.paper' }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
        <Meta
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'text.primary',
          }}
        >
          {fileName}
        </Meta>
      </Stack>
    );
  }

  if (status === 'error') {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 1.5, py: 1, borderRadius: 1, backgroundColor: 'background.paper' }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 20, color: 'error.main' }} />
        <ErrorText sx={{ flex: 1 }}>{errorMessage}</ErrorText>
        <IconButton
          size="small"
          aria-label="Remove failed upload"
          onClick={handleParentErrorRetry}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
    );
  }

  if (pickedFile && isCompliance) {
    return (
      <ComplianceForm
        documentType={documentType}
        onSubmit={handleComplianceSubmit}
        onCancel={handleComplianceCancel}
      />
    );
  }

  return (
    <Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<CloudUploadOutlinedIcon />}
        onClick={openFilePicker}
      >
        Upload
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        data-testid="file-input"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      />
    </Box>
  );
};
