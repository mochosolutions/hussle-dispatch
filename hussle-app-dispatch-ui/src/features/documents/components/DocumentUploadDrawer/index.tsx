import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  TextField,
} from '@mui/material';
import { ErrorText, Meta, MetaStrong, SectionTitle } from 'components/Typography';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { CancelButton } from '@mocho/ui/components/form-fields';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { EditDrawer } from 'components/EditDrawer';
import { DocumentPicker } from 'components/DocumentPicker';
import type { QueuedDocument } from 'components/DocumentPicker';
import { useDispatch, useSelector } from 'store';
import { validateUpload } from 'utils/documents/validateUpload';
import { DOC_TYPE_CONFIG, DOC_CARD_CONFIGS, METADATA_FIELD_LABELS } from '../../constants';
import type { DocumentContext } from '../../constants';
import { uploadDocumentRequest, clearUploadStatus } from '../../store/reducers/documentPageSlice';
import { selectUploadStatus, selectUploadError } from '../../store/selectors/documentSelectors';
import { DocumentType } from '../../types';
import type { DocumentEntityType } from '../../types';

const OTHER_LABEL_MAX_LENGTH = 80;

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
      <Meta
        sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}
      >
        {item.fileName}
      </Meta>
      {status === 'Rejected' && error && (
        <ErrorText>
          {error}
        </ErrorText>
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
      <MetaStrong sx={{ mb: 2 }}>
        Complete details before uploading
      </MetaStrong>

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
          <CancelButton onClick={onCancel} size="small" />
        </Stack>
      </Stack>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// OTHER document — custom label form
// ---------------------------------------------------------------------------

interface OtherLabelFormProps {
  fileName: string;
  onSubmit: (customLabel: string) => void;
  onCancel: () => void;
}

export const OtherLabelForm: React.FC<OtherLabelFormProps> = ({
  fileName,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const isValid = trimmed.length > 0;

  const handleSubmit = useCallback(() => {
    if (!isValid) {
      return;
    }
    onSubmit(trimmed);
  }, [isValid, trimmed, onSubmit]);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <MetaStrong sx={{ mb: 0.5 }}>
        Name this document
      </MetaStrong>
      <Meta sx={{ display: 'block', mb: 2 }}>
        {fileName}
      </Meta>

      <Stack spacing={2}>
        <TextField
          id="other-document-name"
          label="Document Name"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, OTHER_LABEL_MAX_LENGTH))}
          size="small"
          fullWidth
          required
          inputProps={{
            maxLength: OTHER_LABEL_MAX_LENGTH,
            'aria-required': 'true',
          }}
          helperText={`Required. Max ${String(OTHER_LABEL_MAX_LENGTH)} characters. (${String(value.length)}/${String(OTHER_LABEL_MAX_LENGTH)})`}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            Upload
          </Button>
          <CancelButton onClick={onCancel} size="small" />
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
  const [pendingOther, setPendingOther] = useState<QueuedDocument | null>(null);

  const drawerTitle =
    lockDocType && preselectedDocType
      ? `Replace: ${DOC_TYPE_CONFIG[preselectedDocType].label}`
      : 'Upload Documents';

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
      // Pre-flight validation: MIME (JPEG/PNG/PDF only) + size (<= 10 MB).
      // Reject before queueing so the user can pick a different file.
      const validation = validateUpload(doc.file);
      if (!validation.ok) {
        dispatch(notify({ message: validation.error.message, variant: 'error' }));
        return;
      }

      const config = DOC_TYPE_CONFIG[doc.documentType];

      // If compliance doc, show metadata form first
      if (config.compliance) {
        setPendingCompliance(doc);
        return;
      }

      // OTHER doc — gate upload on a custom label
      if (doc.documentType === DocumentType.OTHER) {
        setPendingOther(doc);
        return;
      }

      // Non-compliance: upload immediately
      dispatchUpload(doc.file, doc.documentType, doc.clientId);
    },
    [dispatchUpload, dispatch],
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

  const handleOtherSubmit = useCallback(
    (customLabel: string) => {
      if (!pendingOther) {
        return;
      }
      dispatchUpload(
        pendingOther.file,
        pendingOther.documentType,
        pendingOther.clientId,
        undefined,
        { customLabel },
      );
      setPendingOther(null);
    },
    [pendingOther, dispatchUpload],
  );

  const handleOtherCancel = useCallback(() => {
    setPendingOther(null);
  }, []);

  const handleRemove = useCallback(
    (clientId: string) => {
      setUploadItems((prev) => prev.filter((item) => item.clientId !== clientId));
      dispatch(clearUploadStatus({ clientId }));
    },
    [dispatch],
  );

  return (
    <EditDrawer open onClose={onClose} title={drawerTitle}>
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

          {/* OTHER custom-label form (shown after picking an OTHER document) */}
          {pendingOther && (
            <OtherLabelForm
              fileName={pendingOther.file.name}
              onSubmit={handleOtherSubmit}
              onCancel={handleOtherCancel}
            />
          )}

          {/* DocumentPicker (hidden while filling compliance or OTHER form) */}
          {!pendingCompliance && !pendingOther && (
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
              <SectionTitle>Uploads</SectionTitle>
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
