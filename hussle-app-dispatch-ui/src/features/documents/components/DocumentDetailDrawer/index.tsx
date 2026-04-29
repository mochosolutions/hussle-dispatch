import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FileTextOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { enqueueSnackbar } from 'notistack';

import { useSelector } from 'store';
import config from '../../../../config';
import SectionCard from 'components/SectionCard';
import { BodyMuted, DetailRow } from 'components/Typography';
import { formattedCurrentUserSelector } from 'features/auth/store/selectors';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { useModalActions } from 'features/ui/hooks/useModalActions';

import { selectDocumentById } from '../../store/selectors/documentSelectors';
import { DOC_TYPE_CONFIG, type DocumentContext } from '../../constants';
import {
  DocumentType,
  type Document,
  type DocumentEntityType,
  type DocumentMetadata,
} from '../../types';
import { ExpiryBadge } from '../ExpiryBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENTITY_TO_CONTEXT: Record<DocumentEntityType, DocumentContext> = {
  load: 'load-detail',
  carrier: 'carrier-detail',
  driver: 'driver-detail',
  vehicle: 'vehicle-detail',
};

const isStringValue = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const readMetadataString = (
  metadata: Record<string, unknown> | null,
  key: keyof DocumentMetadata,
): string | undefined => {
  if (metadata === null) {
    return undefined;
  }
  const value = metadata[key];
  return isStringValue(value) ? value : undefined;
};

const getTypeLabel = (doc: Document): string => {
  if (doc.type === DocumentType.OTHER) {
    const customLabel = readMetadataString(doc.metadata, 'customLabel');
    if (customLabel !== undefined) {
      return customLabel;
    }
  }
  return DOC_TYPE_CONFIG[doc.type]?.label ?? doc.type;
};

const formatDate = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return format(new Date(value), 'MMM d, yyyy');
};

const openInNewTab = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

// ---------------------------------------------------------------------------
// Preview subcomponent
// ---------------------------------------------------------------------------

interface DocumentPreviewAreaProps {
  fileName: string;
  mimeType: string | null;
  url: string;
  onDownload: () => void;
}

const DocumentPreviewArea: React.FC<DocumentPreviewAreaProps> = ({
  fileName,
  mimeType,
  url,
  onDownload,
}) => {
  if (mimeType === 'application/pdf') {
    return (
      <iframe
        src={url}
        title={`PDF preview of ${fileName}`}
        aria-label={`PDF preview of ${fileName}`}
        style={{
          width: '100%',
          height: 'min(60vh, 720px)',
          border: 'none',
          borderRadius: 4,
        }}
      />
    );
  }

  if (mimeType !== null && mimeType.startsWith('image/')) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={url}
          alt={fileName}
          sx={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 1 }}
        />
      </Box>
    );
  }

  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{ py: 6, px: 2, textAlign: 'center' }}
    >
      <Box sx={{ fontSize: 36, color: 'text.disabled' }}>
        <FileTextOutlined aria-hidden="true" />
      </Box>
      <BodyMuted>Preview is not available for this file type.</BodyMuted>
      <Button variant="contained" size="small" onClick={onDownload}>
        Download
      </Button>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Type-specific metadata rows
// ---------------------------------------------------------------------------

const renderMetadataRow = (label: string, value: string | undefined): React.ReactNode => (
  <DetailRow
    label={label}
    value={value ?? <Box component="span" sx={{ color: 'text.secondary' }}>—</Box>}
  />
);

const renderTypeSpecificRows = (doc: Document): React.ReactNode => {
  if (doc.type === DocumentType.INSURANCE_CERT) {
    return renderMetadataRow('Policy Number', readMetadataString(doc.metadata, 'policyNumber'));
  }

  if (doc.type === DocumentType.LICENSE) {
    return (
      <>
        {renderMetadataRow('License #', readMetadataString(doc.metadata, 'licenseNumber'))}
        {renderMetadataRow('Issuing State', readMetadataString(doc.metadata, 'issuingState'))}
        {renderMetadataRow('CDL Class', readMetadataString(doc.metadata, 'cdlClass'))}
      </>
    );
  }

  return null;
};

// ---------------------------------------------------------------------------
// Main drawer
// ---------------------------------------------------------------------------

export interface DocumentDetailDrawerProps {
  documentId: string;
  onClose: () => void;
}

export const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  documentId,
  onClose,
}) => {
  const doc = useSelector(selectDocumentById(documentId));
  const currentUser = useSelector(formattedCurrentUserSelector);
  const isAdmin = currentUser.role === 'ADMIN';
  const { openDrawer, closeDrawer } = useDrawerActions();
  const { openModal } = useModalActions();

  const downloadUrl = `${config.apiUrl}/api/v1/documents/${documentId}/download`;

  // Handle case where the document was deleted while drawer is open
  useEffect(() => {
    if (!doc) {
      enqueueSnackbar('Document is no longer available', { variant: 'info' });
      onClose();
    }
  }, [doc, onClose]);

  if (!doc) {
    return null;
  }

  const handleDownload = () => {
    openInNewTab(downloadUrl);
  };

  const handleReplace = () => {
    closeDrawer();
    openDrawer('documentUpload', {
      context: ENTITY_TO_CONTEXT[doc.entityType],
      entityType: doc.entityType,
      entityId: doc.entityId,
      preselectedDocType: doc.type,
      lockDocType: true,
    });
  };

  const handleDelete = () => {
    openModal('confirmDeleteDocument', {
      documentId: doc.id,
      fileName: doc.fileName,
      type: doc.type,
    });
  };

  const showFooterDelete = isAdmin;

  const uploaderName = doc.uploadedBy
    ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`.trim()
    : null;

  const customLabel = readMetadataString(doc.metadata, 'customLabel');
  const titleLabel =
    doc.type === DocumentType.OTHER && customLabel !== undefined ? customLabel : doc.fileName;

  return (
    <Drawer
      anchor="right"
      open
      onClose={(_event, reason) => {
        if (reason === 'backdropClick') return;
        onClose();
      }}
      PaperProps={{
        sx: {
          width: { xs: '100vw', md: 640 },
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'drawer.headerBg',
          borderBottom: '1px solid',
          borderColor: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Box sx={{ minWidth: 0, pr: 2 }}>
          <Typography
            variant="h5"
            sx={{
              color: 'drawer.headerText',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {titleLabel}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close drawer"
          sx={{
            color: 'drawer.headerText',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            width: 28,
            height: 28,
            flexShrink: 0,
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper', p: 2 }}>
        <Stack spacing={2}>
          <SectionCard title="Document Details">
            <DetailRow label="Type" value={getTypeLabel(doc)} />
            <DetailRow label="File" value={doc.fileName} />
            {uploaderName !== null && <DetailRow label="Uploaded By" value={uploaderName} />}
            <DetailRow label="Uploaded" value={formatDate(doc.createdAt)} />
            {doc.expiresAt !== null && (
              <DetailRow
                label="Expires"
                value={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span">{formatDate(doc.expiresAt)}</Box>
                    <ExpiryBadge expiresAt={doc.expiresAt} />
                  </Box>
                }
              />
            )}
            {renderTypeSpecificRows(doc)}
            <DetailRow
              label="Notes"
              value={doc.notes ? doc.notes : <Box component="span" sx={{ color: 'text.secondary' }}>—</Box>}
              noBorder
            />
          </SectionCard>

          <SectionCard title="Preview">
            <DocumentPreviewArea
              fileName={doc.fileName}
              mimeType={doc.mimeType}
              url={downloadUrl}
              onDownload={handleDownload}
            />
          </SectionCard>
        </Stack>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'grey.100',
          borderTop: 1,
          borderColor: 'divider',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleDownload}>
            Download
          </Button>
          <Button variant="outlined" onClick={handleReplace}>
            Replace
          </Button>
        </Stack>
        {showFooterDelete && (
          <Button variant="text" color="error" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </Box>
    </Drawer>
  );
};

export default DocumentDetailDrawer;
