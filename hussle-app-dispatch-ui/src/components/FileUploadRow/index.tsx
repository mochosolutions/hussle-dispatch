import { Box, IconButton, LinearProgress, Stack, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { Body, Meta, ErrorText } from 'components/Typography';

interface FileUploadRowProps {
  label: string;
  required?: boolean;
  file?: File | null;
  onUpload: () => void;
  onRemove: () => void;
  status: 'idle' | 'uploading' | 'done' | 'error';
  // Re-upload over an already-done row (resets it and uploads the new file).
  onReplace?: () => void;
  // Opens the uploaded document via a signed GET URL in a new tab.
  onView?: () => void;
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
  onReplace,
  onView,
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
        <Body sx={{ fontWeight: 500 }}>{file ? file.name : label}</Body>
        {required && !file && status !== 'done' && <ErrorText>*</ErrorText>}
      </Stack>
      {file && <Meta>{formatFileSize(file.size)}</Meta>}
      {status === 'uploading' && <LinearProgress sx={{ mt: 0.5, borderRadius: 1 }} />}
      {status === 'error' && <ErrorText>Upload failed</ErrorText>}
    </Box>

    {status === 'done' && <CheckCircleIcon sx={{ color: 'secondary.main', fontSize: 20 }} />}
    {status === 'error' && <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />}

    {/* Done row: View + Replace affordances. */}
    {status === 'done' && onView && (
      <Tooltip title={`View ${label}`}>
        <IconButton size="small" onClick={onView} aria-label={`View ${label}`}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {status === 'done' && onReplace && (
      <Tooltip title={`Replace ${label}`}>
        <IconButton size="small" onClick={onReplace} aria-label={`Replace ${label}`}>
          <AutorenewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}

    {status === 'idle' && !file && (
      <IconButton size="small" onClick={onUpload} aria-label={`Upload ${label}`}>
        <UploadFileIcon fontSize="small" />
      </IconButton>
    )}

    {file && status !== 'done' && (
      <IconButton size="small" onClick={onRemove} aria-label={`Remove ${label}`}>
        <CloseIcon fontSize="small" />
      </IconButton>
    )}
  </Stack>
);
