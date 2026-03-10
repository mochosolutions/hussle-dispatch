import { Card, Box } from '@mui/material';
import { DocumentList } from '../../../../documents/components/DocumentList';

interface DocumentsTabProps {
  carrierId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ carrierId }) => (
  <Card>
    <Box sx={{ p: 3 }}>
      <DocumentList carrierId={carrierId} />
    </Box>
  </Card>
);
