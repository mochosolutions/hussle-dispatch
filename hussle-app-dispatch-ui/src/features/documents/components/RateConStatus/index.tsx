import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Collapse,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';

import type { Document, DocumentType } from '../../types';
import { DocumentUpload } from '../DocumentUpload';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RateConStatusProps {
  loadId: string;
  loadStatus: string;
  rateConReceivedAt: string | null;
  onUploadComplete?: (document: Document) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPLOAD_VISIBLE_STATUSES = new Set(['QUOTED', 'BOOKED']);

const RATE_CON_DOC_TYPE: DocumentType = 'RATE_CONFIRMATION';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RateConStatus: React.FC<RateConStatusProps> = ({
  loadId,
  loadStatus,
  rateConReceivedAt,
  onUploadComplete,
}) => {
  const [showUpload, setShowUpload] = useState(false);

  const canUpload = UPLOAD_VISIBLE_STATUSES.has(loadStatus);

  const handleToggleUpload = useCallback(() => {
    setShowUpload((prev) => !prev);
  }, []);

  const handleUploadComplete = useCallback(
    (document: Document) => {
      setShowUpload(false);
      onUploadComplete?.(document);
    },
    [onUploadComplete],
  );

  // Rate con received — show success indicator
  if (rateConReceivedAt) {
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
        <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
          Rate con received {format(new Date(rateConReceivedAt), 'MMM d, yyyy')}
        </Typography>
      </Stack>
    );
  }

  // No rate con — show warning + optional upload
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
        <WarningOutlined style={{ fontSize: 16, color: '#faad14' }} />
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.main' }}>
          No rate con on file
        </Typography>
        {canUpload && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUploadOutlined />}
            onClick={handleToggleUpload}
            sx={{ ml: 1 }}
          >
            {showUpload ? 'Cancel' : 'Upload Rate Con'}
          </Button>
        )}
      </Stack>

      {canUpload && (
        <Collapse in={showUpload}>
          <Box sx={{ mt: 1.5 }}>
            <DocumentUpload
              loadId={loadId}
              documentType={RATE_CON_DOC_TYPE}
              onUploadComplete={handleUploadComplete}
            />
          </Box>
        </Collapse>
      )}
    </Box>
  );
};
