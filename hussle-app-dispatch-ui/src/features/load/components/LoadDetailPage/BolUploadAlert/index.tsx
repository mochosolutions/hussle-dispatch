import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';

import { Meta, MetaStrong } from 'components/Typography';
import { SingleDocumentUpload } from 'components/SingleDocumentUpload';
import { useDispatch, useSelector } from 'store';
import {
  clearUploadStatus,
  uploadDocumentRequest,
} from 'features/documents/store/reducers/documentPageSlice';
import {
  selectUploadError,
  selectUploadStatus,
} from 'features/documents/store/selectors/documentSelectors';
import { DocumentType } from 'features/documents/types';

import { fetchLoadDetailsRequest } from '../../../store/reducers';

interface BolUploadAlertProps {
  loadId: string;
}

const MAX_BOL_SIZE_BYTES = 10 * 1024 * 1024;

type UploadVisualStatus = 'idle' | 'uploading' | 'success' | 'error';

const mapSliceStatusToVisual = (sliceStatus: string): UploadVisualStatus => {
  if (sliceStatus === 'Pending') {
    return 'uploading';
  }
  if (sliceStatus === 'Fulfilled') {
    return 'success';
  }
  if (sliceStatus === 'Rejected') {
    return 'error';
  }
  return 'idle';
};

export const BolUploadAlert: React.FC<BolUploadAlertProps> = ({ loadId }) => {
  const dispatch = useDispatch();
  const refetchedRef = useRef(false);

  const clientId = useMemo(() => crypto.randomUUID(), []);
  const [fileName, setFileName] = useState<string | undefined>(undefined);

  const sliceStatus = useSelector(selectUploadStatus(clientId));
  const uploadError = useSelector(selectUploadError(clientId));
  const visualStatus = mapSliceStatusToVisual(sliceStatus);

  useEffect(() => {
    if (visualStatus === 'success' && !refetchedRef.current) {
      refetchedRef.current = true;
      dispatch(fetchLoadDetailsRequest({ id: loadId }));
    }
  }, [visualStatus, dispatch, loadId]);

  const handleUpload = useCallback(
    (file: File, expiresAt: string, metadata: Record<string, string>) => {
      refetchedRef.current = false;
      setFileName(file.name);
      dispatch(
        uploadDocumentRequest({
          file,
          documentType: DocumentType.BOL_SIGNED,
          entityType: 'load',
          entityId: loadId,
          clientId,
          expiresAt: expiresAt || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }),
      );
    },
    [dispatch, loadId, clientId],
  );

  const handleReset = useCallback(() => {
    setFileName(undefined);
    dispatch(clearUploadStatus({ clientId }));
  }, [dispatch, clientId]);

  return (
    <Alert severity="info" icon={<CloudUploadOutlinedIcon />} sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <MetaStrong sx={{ color: 'text.primary' }}>Awaiting signed BOL</MetaStrong>
        <Meta sx={{ color: 'text.primary' }}>
          Once uploaded, the invoice will be created automatically.
        </Meta>
        <SingleDocumentUpload
          documentType={DocumentType.BOL_SIGNED}
          maxFileSize={MAX_BOL_SIZE_BYTES}
          status={visualStatus}
          errorMessage={uploadError || undefined}
          fileName={fileName}
          onUpload={handleUpload}
          onReset={handleReset}
        />
      </Box>
    </Alert>
  );
};
