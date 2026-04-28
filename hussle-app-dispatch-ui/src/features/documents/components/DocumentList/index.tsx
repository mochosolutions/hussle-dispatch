import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Collapse,
} from '@mui/material';
import { CloudUploadOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

import { listDocuments } from 'utils/api/documents/documentApi';
import type { Document, DocumentType } from '../../types';
import { DocumentUpload } from '../DocumentUpload';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  BOL: 'BOL',
  POD: 'POD',
  RATE_CONFIRMATION: 'Rate Con',
  INSURANCE: 'Insurance',
  INVOICE: 'Invoice',
  W9: 'W-9',
  CARRIER_AGREEMENT: 'Carrier Agreement',
  OTHER: 'Other',
};

const DOCUMENT_TYPE_COLORS: Record<
  DocumentType,
  'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default'
> = {
  BOL: 'primary',
  POD: 'success',
  RATE_CONFIRMATION: 'info',
  INSURANCE: 'warning',
  INVOICE: 'secondary',
  W9: 'default',
  CARRIER_AGREEMENT: 'default',
  OTHER: 'default',
};

const SECTION_LABEL_SX = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DocumentListProps {
  loadId?: string;
  carrierId?: string;
  /** Document type to use when uploading. Defaults to OTHER. */
  defaultUploadType?: DocumentType;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DocumentList: React.FC<DocumentListProps> = ({
  loadId,
  carrierId,
  defaultUploadType = 'OTHER',
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listDocuments({ loadId, carrierId });
      setDocuments(result.data);
    } catch {
      // Silently handle — empty list shown
    } finally {
      setIsLoading(false);
    }
  }, [loadId, carrierId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadComplete = useCallback((document: Document) => {
    setDocuments((prev) => [document, ...prev]);
    setShowUpload(false);
  }, []);

  const handleToggleUpload = useCallback(() => {
    setShowUpload((prev) => !prev);
  }, []);

  const handleViewDocument = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDownloadDocument = useCallback((url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }, []);

  return (
    <Box>
      {/* <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" sx={SECTION_LABEL_SX}>
          Documents
        </Typography>
        <Button
          size="small"
          startIcon={<CloudUploadOutlined />}
          onClick={handleToggleUpload}
          variant={showUpload ? 'outlined' : 'text'}
        >
          {showUpload ? 'Cancel' : 'Upload'}
        </Button>
      </Stack> */}

      <Collapse in={showUpload}>
        <Box sx={{ mb: 2 }}>
          <DocumentUpload
            context={loadId ? 'load-detail' : 'carrier-detail'}
            entityType={loadId ? 'load' : 'carrier'}
            entityId={(loadId ?? carrierId) as string}
            onUploadComplete={() => fetchDocuments()}
          />
        </Box>
      </Collapse>

      {isLoading && (
        <Typography variant="caption" color="text.disabled">
          Loading documents...
        </Typography>
      )}

      {!isLoading && documents.length === 0 && (
        <Typography variant="caption" color="text.disabled">
          No documents uploaded yet
        </Typography>
      )}

      {documents.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Chip
                      label={DOCUMENT_TYPE_LABELS[doc.documentType]}
                      size="small"
                      color={DOCUMENT_TYPE_COLORS[doc.documentType]}
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.6875rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {doc.fileName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(doc.createdAt), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocument(doc.url)}
                        aria-label={`View ${doc.fileName}`}
                      >
                        <EyeOutlined />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadDocument(doc.url, doc.fileName)}
                        aria-label={`Download ${doc.fileName}`}
                      >
                        <DownloadOutlined />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
