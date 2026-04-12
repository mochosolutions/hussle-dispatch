import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { EditDrawer } from 'components/EditDrawer';
import { DocumentPicker } from 'components/DocumentPicker';
import type { QueuedDocument } from 'components/DocumentPicker';
import { useDispatch, useSelector } from 'store';
import { DOC_TYPE_CONFIG, DOC_CARD_CONFIGS, METADATA_FIELD_LABELS } from '../../constants';
import type { DocumentContext } from '../../constants';
import { uploadDocumentRequest, clearUploadStatus } from '../../store/reducers/documentPageSlice';
import { selectUploadStatus, selectUploadError } from '../../store/selectors/documentSelectors';
import type { DocumentEntityType, DocumentType } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentUploadDrawerProps {
  context: DocumentContext;
  entityType: DocumentEntityType;
  entityId: string;
  preselectedDocType?: DocumentType;
  lockDocType?: boolean;
  onClose: () => void;
}

interface UploadItem {
  clientId: string;
  fileName: string;
  documentType: DocumentType;
}

// ---------------------------------------------------------------------------
// Upload status row — shows per-file progress
// ---------------------------------------------------------------------------

const UploadStatusRow: React.FC<{ item: UploadItem }> = ({ item }) => {
  const status = useSelector(selectUploadStatus(item.clientId));
  const error = useSelector(selectUploadError(item.clientId));
  const label = DOC_TYPE_CONFIG[item.documentType].label;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ px: 1.5, py: 1, borderRadius: 1, backgroundColor: 'action.hover' }}
    >
      {status === 'Pending' && (
        <LinearProgress sx={{ width: 24, height: 4, borderRadius: 1, flexShrink: 0 }} />
      )}
      {status === 'Fulfilled' && (
        <CheckCircleOutlineIcon sx={{ fontSize: 20, color: 'success.main' }} />
      )}
      {status === 'Rejected' && (
        <ErrorOutlineIcon sx={{ fontSize: 20, color: 'error.main' }} />
      )}
      <Chip label={label} size="small" variant="outlined" color="primary" />
      <Typography
        variant="body2"
        sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {item.fileName}
      </Typography>
      {status === 'Rejected' && error && (
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      )}
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Compliance metadata form
// ---------------------------------------------------------------------------

interface ComplianceFormProps {
  documentType: DocumentType;
  onSubmit: (expiresAt: string, metadata: Record<string, string>) => void;
  onCancel: () => void;
}

const ComplianceForm: React.FC<ComplianceFormProps> = ({
  documentType,
  onSubmit,
  onCancel,
}) => {
  const config = DOC_TYPE_CONFIG[documentType];
  const metadataFields = 'metadataFields' in config ? config.metadataFields : [];
  const [expiresAt, setExpiresAt] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(() => {
    onSubmit(expiresAt, metadata);
  }, [expiresAt, metadata, onSubmit]);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 2 }}>
        Complete details before uploading
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Expiration Date"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        {metadataFields?.map((field) => (
          <TextField
            key={field}
            label={METADATA_FIELD_LABELS[field] ?? field}
            value={metadata[field] ?? ''}
            onChange={(e) => setMetadata((prev) => ({ ...prev, [field]: e.target.value }))}
            size="small"
            fullWidth
          />
        ))}

        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={handleSubmit}>
            Upload
          </Button>
          <Button variant="outlined" size="small" onClick={onCancel}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main drawer component
// ---------------------------------------------------------------------------

export const DocumentUploadDrawer: React.FC<DocumentUploadDrawerProps> = ({
  context,
  entityType,
  entityId,
  preselectedDocType,
  lockDocType,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [pendingCompliance, setPendingCompliance] = useState<QueuedDocument | null>(null);

  // Build doc type cards — filter to preselected if locked
  const docTypes = useMemo(() => {
    const configs = DOC_CARD_CONFIGS[context];
    if (lockDocType && preselectedDocType) {
      return configs.filter((c) => c.type === preselectedDocType);
    }
    return configs;
  }, [context, lockDocType, preselectedDocType]);

  const dispatchUpload = useCallback(
    (
      file: File,
      documentType: DocumentType,
      clientId: string,
      expiresAt?: string,
      metadata?: Record<string, string>,
    ) => {
      setUploadItems((prev) => [...prev, { clientId, fileName: file.name, documentType }]);
      dispatch(
        uploadDocumentRequest({
          file,
          documentType,
          entityType,
          entityId,
          clientId,
          ...(expiresAt ? { expiresAt } : {}),
          ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
        }),
      );
    },
    [dispatch, entityType, entityId],
  );

  const handleAdd = useCallback(
    (doc: QueuedDocument) => {
      const config = DOC_TYPE_CONFIG[doc.documentType];

      // If compliance doc, show metadata form first
      if (config.compliance) {
        setPendingCompliance(doc);
        return;
      }

      // Non-compliance: upload immediately
      dispatchUpload(doc.file, doc.documentType, doc.clientId);
    },
    [dispatchUpload],
  );

  const handleComplianceSubmit = useCallback(
    (expiresAt: string, metadata: Record<string, string>) => {
      if (!pendingCompliance) {
        return;
      }
      dispatchUpload(
        pendingCompliance.file,
        pendingCompliance.documentType,
        pendingCompliance.clientId,
        expiresAt,
        metadata,
      );
      setPendingCompliance(null);
    },
    [pendingCompliance, dispatchUpload],
  );

  const handleComplianceCancel = useCallback(() => {
    setPendingCompliance(null);
  }, []);

  const handleRemove = useCallback(
    (clientId: string) => {
      setUploadItems((prev) => prev.filter((item) => item.clientId !== clientId));
      dispatch(clearUploadStatus({ clientId }));
    },
    [dispatch],
  );

  return (
    <EditDrawer open onClose={onClose} title="Upload Documents">
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Compliance metadata form (shown when a compliance doc is selected) */}
          {pendingCompliance && (
            <ComplianceForm
              documentType={pendingCompliance.documentType}
              onSubmit={handleComplianceSubmit}
              onCancel={handleComplianceCancel}
            />
          )}

          {/* DocumentPicker (hidden while filling compliance form) */}
          {!pendingCompliance && (
            <DocumentPicker
              documents={[]}
              onAdd={handleAdd}
              onRemove={handleRemove}
              docTypes={docTypes}
              addLabel="Select document to upload"
              addHelperText="PDF or image · Select type then upload"
            />
          )}

          {/* Upload status list */}
          {uploadItems.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Uploads</Typography>
              {uploadItems.map((item) => (
                <UploadStatusRow key={item.clientId} item={item} />
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
    </EditDrawer>
  );
};
