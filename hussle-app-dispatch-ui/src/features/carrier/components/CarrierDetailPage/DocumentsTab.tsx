import { useCallback } from 'react';
import { Button } from '@mui/material';
import { CloudUploadOutlined } from '@ant-design/icons';
import SectionCard from 'components/SectionCard';
import { DocumentTable } from '../../../documents/components/DocumentTable';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';

interface DocumentsTabProps {
  carrierId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ carrierId }) => {
  const { openDrawer } = useDrawerActions();

  const handleUploadClick = useCallback(() => {
    openDrawer('documentUpload', {
      context: 'carrier-detail',
      entityType: 'carrier',
      entityId: carrierId,
    });
  }, [openDrawer, carrierId]);

  return (
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
      <DocumentTable entityType="carrier" entityId={carrierId} />
    </SectionCard>
  );
};
