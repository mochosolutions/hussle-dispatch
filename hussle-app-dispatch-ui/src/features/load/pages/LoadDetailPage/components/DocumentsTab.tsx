import { useCallback } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { CloudUploadOutlined } from '@ant-design/icons';
import SectionCard from 'components/SectionCard';
import { DocumentTable } from '../../../../documents/components/DocumentTable';
import { useDrawerActions } from '../../../../ui/hooks/useDrawerActions';
import type { LoadDetail } from '../../../types';

interface DocumentsTabProps {
  load: LoadDetail;
  showRateConPrompt: boolean;
  onDismissRateConPrompt: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  load,
  showRateConPrompt,
  onDismissRateConPrompt,
}) => {
  const { openDrawer } = useDrawerActions();

  const handleUploadClick = useCallback(() => {
    openDrawer('documentUpload', {
      context: 'load-detail',
      entityType: 'load',
      entityId: load.id,
    });
  }, [openDrawer, load.id]);

  return (
    <Stack spacing={2}>
      {showRateConPrompt && !load.rateConReceivedAt && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={onDismissRateConPrompt}>
              Dismiss
            </Button>
          }
        >
          Upload the broker rate confirmation now? See the Rate Confirmation section below.
        </Alert>
      )}

      <SectionCard
        title="Documents"
        actions={
          <Button
            size="small"
            startIcon={<CloudUploadOutlined />}
            variant="outlined"
            onClick={handleUploadClick}
          >
            Upload
          </Button>
        }
      >
        <DocumentTable entityType="load" entityId={load.id} />
      </SectionCard>
    </Stack>
  );
};
