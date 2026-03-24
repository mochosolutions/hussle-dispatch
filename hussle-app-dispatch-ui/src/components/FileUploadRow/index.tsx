import { Box, IconButton, LinearProgress, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Body, Meta, ErrorText } from 'components/Typography';

interface FileUploadRowProps {
  label: string;
  required?: boolean;
  file?: File | null;
  onUpload: () => void;
  onRemove: () => void;
  status: 'idle' | 'uploading' | 'done' | 'error';
  sx?: SxProps<Theme>;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileUploadRow: React.FC<FileUploadRowProps> = ({
  label,
  required,
  file,
  onUpload,
  onRemove,
  status,
  sx,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.5}
    sx={{
      py: 1.25,
      px: 2,
      borderBottom: '1px solid',
      borderColor: 'grey.200',
      ...sx,
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Body sx={{ fontWeight: 500 }}>
          {file ? file.name : label}
        </Body>
        {required && !file && <ErrorText>*</ErrorText>}
      </Stack>
      {file && <Meta>{formatFileSize(file.size)}</Meta>}
      {status === 'uploading' && <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />}
      {status === 'error' && <ErrorText>Upload failed</ErrorText>}
    </Box>

    {status === 'done' && <CheckCircleIcon sx={{ color: 'secondary.main', fontSize: 20 }} />}
    {status === 'error' && <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />}

    {status === 'idle' && !file && (
      <IconButton size="small" onClick={onUpload} aria-label={`Upload ${label}`}>
        <UploadFileIcon fontSize="small" />
      </IconButton>
    )}

    {file && (
      <IconButton size="small" onClick={onRemove} aria-label={`Remove ${label}`}>
        <CloseIcon fontSize="small" />
      </IconButton>
    )}
  </Stack>
);
