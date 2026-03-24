import { Card, Box } from '@mui/material';
import { DocumentUpload } from '../../../../documents/components/DocumentUpload';

interface DocumentsTabProps {
  carrierId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ carrierId }) => (
  <Card>
    <Box sx={{ p: 3 }}>
      <DocumentUpload context="carrier-detail" entityType="carrier" entityId={carrierId} />
    </Box>
  </Card>
);
