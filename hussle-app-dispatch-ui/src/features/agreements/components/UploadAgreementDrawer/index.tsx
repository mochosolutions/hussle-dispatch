import { useState, useCallback, useMemo } from 'react';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';

import { EditDrawer } from 'components/EditDrawer';
import { Body, BodyMuted, ErrorText } from 'components/Typography';
import { useDispatch } from 'store';
import {
  presignDocument,
  uploadDocumentToS3,
} from 'utils/api/documents/documentApi';
import { DocumentType } from 'features/documents/types';

import { createManualAgreementRequest } from '../../store/reducers/agreementsSlice';
import type { AgreementTemplateKey } from '../../types';

interface UploadAgreementDrawerProps {
  carrierId: string;
  onClose: () => void;
}

const TEMPLATE_OPTIONS: { value: AgreementTemplateKey; label: string }[] = [
  { value: 'DISPATCH_AGREEMENT', label: 'Dispatch Agreement' },
];

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

export const UploadAgreementDrawer: React.FC<UploadAgreementDrawerProps> = ({
  carrierId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [templateKey, setTemplateKey] = useState<AgreementTemplateKey>('DISPATCH_AGREEMENT');
  const [file, setFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signedAt, setSignedAt] = useState(todayIsoDate());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = useMemo(
    () =>
      file !== null ||
      signerName.trim().length > 0 ||
      signerEmail.trim().length > 0 ||
      signedAt !== todayIsoDate(),
    [file, signerName, signerEmail, signedAt],
  );

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setFile(selected ?? null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (file === null) {
      setError('Please attach a signed PDF.');
      return;
    }
    if (signerName.trim().length === 0) {
      setError('Signer name is required.');
      return;
    }
    if (signedAt.length === 0) {
      setError('Signed date is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { presign } = await presignDocument({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        type: DocumentType.DISPATCH_AGREEMENT,
        entityType: 'carrier',
        entityId: carrierId,
      });

      await uploadDocumentToS3(presign.presignedUrl, file);

      dispatch(
        createManualAgreementRequest({
          carrierId,
          templateKey,
          signedPdfS3Key: presign.s3Key,
          signerName: signerName.trim(),
          signerEmail:
            signerEmail.trim().length > 0 ? signerEmail.trim() : undefined,
          signedAt: new Date(`${signedAt}T12:00:00`).toISOString(),
        }),
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [carrierId, dispatch, file, onClose, signedAt, signerEmail, signerName, templateKey]);

  return (
    <EditDrawer
      open
      onClose={onClose}
      title="Upload signed agreement"
      subtitle="Record an agreement that was signed outside the carrier portal."
      isDirty={isDirty}
      footer={
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading…' : 'Upload agreement'}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <TextField
          select
          label="Template"
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value as AgreementTemplateKey)}
          size="small"
        >
          {TEMPLATE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <Box>
          <Body>Signed PDF</Body>
          <Box sx={{ mt: 1 }}>
            <Button variant="outlined" component="label" size="small">
              {file === null ? 'Choose file' : 'Replace file'}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                hidden
              />
            </Button>
            {file !== null && (
              <BodyMuted sx={{ display: 'inline', ml: 1 }}>{file.name}</BodyMuted>
            )}
          </Box>
        </Box>

        <TextField
          label="Signer name"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          size="small"
          required
        />

        <TextField
          label="Signer email (optional)"
          type="email"
          value={signerEmail}
          onChange={(e) => setSignerEmail(e.target.value)}
          size="small"
        />

        <TextField
          label="Signed date"
          type="date"
          value={signedAt}
          onChange={(e) => setSignedAt(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        {error !== null && <ErrorText>{error}</ErrorText>}
      </Stack>
    </EditDrawer>
  );
};
