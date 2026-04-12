import { useCallback } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';

import { DocumentType } from '../../types';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RateConStatusProps {
  loadId: string;
  loadStatus: string;
  rateConReceivedAt: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPLOAD_VISIBLE_STATUSES = new Set(['QUOTED', 'BOOKED']);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RateConStatus: React.FC<RateConStatusProps> = ({
  loadId,
  loadStatus,
  rateConReceivedAt,
}) => {
  const { openDrawer } = useDrawerActions();
  const canUpload = UPLOAD_VISIBLE_STATUSES.has(loadStatus);

  const handleUploadClick = useCallback(() => {
    openDrawer('documentUpload', {
      context: 'load-detail',
      entityType: 'load',
      entityId: loadId,
      preselectedDocType: DocumentType.BROKER_RATE_CON,
      lockDocType: true,
    });
  }, [openDrawer, loadId]);

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
            onClick={handleUploadClick}
            sx={{ ml: 1 }}
          >
            Upload Rate Con
          </Button>
        )}
      </Stack>
    </Box>
  );
};
