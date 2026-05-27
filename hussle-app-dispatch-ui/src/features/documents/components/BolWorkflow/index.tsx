import { useCallback } from 'react';
import {
  Box,
  Button,
  Stack,
} from '@mui/material';
import {
  CheckCircleOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';

import { Meta, MetaStrong, SectionLabel, WarningText } from 'components/Typography';

import { DocumentType } from '../../types';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BolWorkflowProps {
  loadId: string;
  loadStatus: string;
  bolUnsignedAt: string | null;
  bolSignedAt: string | null;
}

// ---------------------------------------------------------------------------
// Status indicator helper
// ---------------------------------------------------------------------------

interface BolStatusIndicatorProps {
  label: string;
  date: string;
}

const BolStatusIndicator: React.FC<BolStatusIndicatorProps> = ({ label, date }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.75 }}>
    <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
    <MetaStrong>{label}</MetaStrong>
    <Meta>{format(new Date(date), 'MMM d, yyyy h:mm a')}</Meta>
  </Stack>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BolWorkflow: React.FC<BolWorkflowProps> = ({
  loadId,
  loadStatus,
  bolUnsignedAt,
  bolSignedAt,
}) => {
  const { openDrawer } = useDrawerActions();

  const needsUnsignedBol = loadStatus === 'AT_PICKUP' && !bolUnsignedAt;
  const needsSignedBol =
    (loadStatus === 'AT_DELIVERY' || loadStatus === 'DELIVERED') && !bolSignedAt;
  const preselectedDocType = needsSignedBol
    ? DocumentType.BOL_SIGNED
    : DocumentType.BOL_UNSIGNED;

  const handleUploadClick = useCallback(() => {
    openDrawer('documentUpload', {
      context: 'load-detail',
      entityType: 'load',
      entityId: loadId,
      preselectedDocType,
      lockDocType: true,
    });
  }, [openDrawer, loadId, preselectedDocType]);

  // Both BOLs uploaded — show completion status
  if (bolUnsignedAt && bolSignedAt) {
    return (
      <Box>
        <SectionLabel sx={{ mb: 1 }}>
          BOL Status
        </SectionLabel>
        <BolStatusIndicator label="Unsigned BOL uploaded" date={bolUnsignedAt} />
        <BolStatusIndicator label="Signed BOL uploaded" date={bolSignedAt} />
      </Box>
    );
  }

  // Show partial status + prompt for missing BOL
  if (needsUnsignedBol || needsSignedBol) {
    const promptLabel = needsUnsignedBol
      ? 'Upload unsigned BOL from shipper'
      : 'Upload signed BOL';

    return (
      <Box>
        <SectionLabel sx={{ mb: 1 }}>
          BOL Status
        </SectionLabel>

        {bolUnsignedAt && (
          <BolStatusIndicator label="Unsigned BOL uploaded" date={bolUnsignedAt} />
        )}

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <FileAddOutlined style={{ fontSize: 18, color: '#faad14' }} />
          <WarningText sx={{ fontWeight: 500 }}>
            {promptLabel}
          </WarningText>
          <Button size="small" variant="outlined" onClick={handleUploadClick}>
            Upload
          </Button>
        </Stack>
      </Box>
    );
  }

  // Default: show whatever status indicators exist
  if (bolUnsignedAt || bolSignedAt) {
    return (
      <Box>
        <SectionLabel sx={{ mb: 1 }}>
          BOL Status
        </SectionLabel>
        {bolUnsignedAt && (
          <BolStatusIndicator label="Unsigned BOL uploaded" date={bolUnsignedAt} />
        )}
        {bolSignedAt && (
          <BolStatusIndicator label="Signed BOL uploaded" date={bolSignedAt} />
        )}
      </Box>
    );
  }

  return null;
};
