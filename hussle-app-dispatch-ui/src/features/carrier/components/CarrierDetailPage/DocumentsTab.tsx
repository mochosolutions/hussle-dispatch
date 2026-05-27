import { useCallback } from 'react';
import { Button, Stack } from '@mui/material';
import { CloudUploadOutlined, FileProtectOutlined } from '@ant-design/icons';
import SectionCard from 'components/SectionCard';
import { DocumentTable } from '../../../documents/components/DocumentTable';
import { AgreementsList } from '../../../agreements/components/AgreementsList';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';

interface DocumentsTabProps {
  carrierId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ carrierId }) => {
  const { openDrawer } = useDrawerActions();

  const handleUploadDocClick = useCallback(() => {
    openDrawer('documentUpload', {
      context: 'carrier-detail',
      entityType: 'carrier',
      entityId: carrierId,
    });
  }, [openDrawer, carrierId]);

  const handleUploadAgreementClick = useCallback(() => {
    openDrawer('uploadAgreement', { carrierId });
  }, [openDrawer, carrierId]);

  return (
    <Stack spacing={2}>
      <SectionCard
        title="Agreements"
        contentSX={{ p: 0 }}
        actions={
          <Button
            size="small"
            startIcon={<FileProtectOutlined />}
            variant="outlined"
            onClick={handleUploadAgreementClick}
          >
            Upload signed agreement
          </Button>
        }
      >
        <AgreementsList carrierId={carrierId} />
      </SectionCard>

      <SectionCard
        title="Documents"
        contentSX={{ p: 0 }}
        actions={
          <Button
            size="small"
            startIcon={<CloudUploadOutlined />}
            variant="outlined"
            onClick={handleUploadDocClick}
          >
            Upload document
          </Button>
        }
      >
        <DocumentTable
          entityType="carrier"
          entityId={carrierId}
          onUpload={handleUploadDocClick}
        />
      </SectionCard>
    </Stack>
  );
};
