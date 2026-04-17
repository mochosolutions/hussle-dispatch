import { useCallback } from 'react';
import { Box, Button, Card } from '@mui/material';
import { CloudUploadOutlined } from '@ant-design/icons';
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
    <Card>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<CloudUploadOutlined />}
            variant="outlined"
            onClick={handleUploadClick}
          >
            Upload
          </Button>
        </Box>
        <DocumentTable entityType="carrier" entityId={carrierId} />
      </Box>
    </Card>
  );
};
