import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useDispatch, useSelector } from 'store';
import { uploadDocumentRequest } from 'features/documents/store/reducers/documentPageSlice';
import {
  selectUploadStatus,
  selectUploadError,
} from 'features/documents/store/selectors/documentSelectors';
import { DocumentType } from 'features/documents/types';
import { fetchLoadDetailsRequest } from '../../../store/reducers';

interface BolUploadAlertProps {
  loadId: string;
}

const MAX_BOL_SIZE_BYTES = 10 * 1024 * 1024;

export const BolUploadAlert: React.FC<BolUploadAlertProps> = ({ loadId }) => {
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const refetchedRef = useRef(false);

  const [upload, setUpload] = useState<{ clientId: string; fileName: string } | null>(null);
  const uploadStatus = useSelector(selectUploadStatus(upload?.clientId ?? ''));
  const uploadError = useSelector(selectUploadError(upload?.clientId ?? ''));
  const isFulfilled = uploadStatus === 'Fulfilled';

  useEffect(() => {
    if (isFulfilled && !refetchedRef.current) {
      refetchedRef.current = true;
      dispatch(fetchLoadDetailsRequest({ id: loadId }));
    }
  }, [isFulfilled, dispatch, loadId]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_BOL_SIZE_BYTES) {
        setUpload({ clientId: '', fileName: file.name });
        e.target.value = '';
        return;
      }
      const clientId = crypto.randomUUID();
      refetchedRef.current = false;
      setUpload({ clientId, fileName: file.name });
      dispatch(
        uploadDocumentRequest({
          file,
          documentType: DocumentType.BOL_SIGNED,
          entityType: 'load',
          entityId: loadId,
          clientId,
        }),
      );
      e.target.value = '';
    },
    [dispatch, loadId],
  );

  return (
    <Alert severity="info" icon={<CloudUploadOutlinedIcon />} sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Awaiting signed BOL
        </Typography>
        <Typography variant="caption">
          Once uploaded, the invoice will be created automatically.
        </Typography>
        {!upload ? (
          <>
            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloudUploadOutlinedIcon />}
                onClick={() => inputRef.current?.click()}
              >
                Upload BOL
              </Button>
            </Box>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
            />
          </>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ px: 1.5, py: 1, borderRadius: 1, backgroundColor: 'background.paper' }}
          >
            {uploadStatus === 'Pending' && (
              <LinearProgress sx={{ width: 24, height: 4, borderRadius: 1, flexShrink: 0 }} />
            )}
            {uploadStatus === 'Fulfilled' && (
              <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
            )}
            {(uploadStatus === 'Rejected' || upload.clientId === '') && (
              <ErrorOutlineIcon sx={{ fontSize: 20, color: 'error.main' }} />
            )}
            <Chip label="BOL" size="small" variant="outlined" color="primary" />
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {upload.fileName}
            </Typography>
            {upload.clientId === '' && (
              <Typography variant="caption" color="error.main">
                File exceeds 10 MB
              </Typography>
            )}
            {uploadStatus === 'Rejected' && uploadError && (
              <Typography variant="caption" color="error.main">
                {uploadError}
              </Typography>
            )}
            {(uploadStatus === 'Rejected' || upload.clientId === '') && (
              <IconButton
                size="small"
                aria-label="Remove failed upload"
                onClick={() => setUpload(null)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        )}
      </Box>
    </Alert>
  );
};
