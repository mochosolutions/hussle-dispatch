import { useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { CloudUploadOutlined } from '@ant-design/icons';
import SectionCard from 'components/SectionCard';
import { DocumentTable } from 'features/documents/components/DocumentTable';
import type { DocumentEntityType } from 'features/documents/types';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';

export interface DocumentsTabProps {
  entityType: DocumentEntityType;
  entityId: string;
  canUpload?: boolean;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ entityType, entityId, canUpload = true }) => {
  const { openDrawer } = useDrawerActions();

  const handleUploadClick = useCallback(() => {
    openDrawer('documentUpload', {
      context: `${entityType}-detail`,
      entityType,
      entityId,
    });
  }, [openDrawer, entityType, entityId]);

  return (
    <SectionCard
      title="Documents"
      contentSX={{ p: 0 }}
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
      <DocumentTable
        entityType={entityType}
        entityId={entityId}
        onUpload={canUpload ? handleUploadClick : undefined}
      />
    </SectionCard>
  );
};

export type { DocumentsTabProps as DocumentsTabPropsType };
export default DocumentsTab;
