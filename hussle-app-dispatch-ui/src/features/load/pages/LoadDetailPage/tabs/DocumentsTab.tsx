import { Alert, Button, Stack } from '@mui/material';
import { CloudUploadOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import SectionCard from 'components/SectionCard';
import { RateConStatus } from '../../../../documents/components/RateConStatus';
import { DocumentUpload } from '../../../../documents/components/DocumentUpload';
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
}) => (
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

    <MainCard>
      <RateConStatus
        loadId={load.id}
        loadStatus={load.status}
        rateConReceivedAt={load.rateConReceivedAt}
      />
    </MainCard>

    <SectionCard
      title="Documents"
      actions={
        <Button
          size="small"
          startIcon={<CloudUploadOutlined />}
          variant="outlined"
        >
          Upload
        </Button>
      }
    >
      <DocumentUpload context="load-detail" entityType="load" entityId={load.id} />
    </SectionCard>
  </Stack>
);
