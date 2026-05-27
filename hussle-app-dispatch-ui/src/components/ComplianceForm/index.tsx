import { useCallback, useState } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';
import { CancelButton } from '@mocho/ui/components/form-fields';

import { MetaStrong } from 'components/Typography';
import { DOC_TYPE_CONFIG, METADATA_FIELD_LABELS } from 'features/documents/constants';
import { DocumentType } from 'features/documents/types';

export interface ComplianceFormProps {
  documentType: DocumentType;
  onSubmit: (expiresAt: string, metadata: Record<string, string>) => void;
  onCancel: () => void;
}

export const ComplianceForm: React.FC<ComplianceFormProps> = ({
  documentType,
  onSubmit,
  onCancel,
}) => {
  const config = DOC_TYPE_CONFIG[documentType];
  const metadataFields = 'metadataFields' in config ? config.metadataFields : [];
  const requiresExpiry = 'requiresExpiry' in config ? config.requiresExpiry === true : false;
  const [expiresAt, setExpiresAt] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(() => {
    onSubmit(expiresAt, metadata);
  }, [expiresAt, metadata, onSubmit]);

  const submitDisabled = requiresExpiry && !expiresAt;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <MetaStrong sx={{ mb: 2 }}>Complete details before uploading</MetaStrong>

      <Stack spacing={2}>
        <TextField
          label="Expiration Date"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        {metadataFields?.map((field) => (
          <TextField
            key={field}
            label={METADATA_FIELD_LABELS[field] ?? field}
            value={metadata[field] ?? ''}
            onChange={(e) => setMetadata((prev) => ({ ...prev, [field]: e.target.value }))}
            size="small"
            fullWidth
          />
        ))}

        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={handleSubmit} disabled={submitDisabled}>
            Upload
          </Button>
          <CancelButton onClick={onCancel} size="small" />
        </Stack>
      </Stack>
    </Box>
  );
};
