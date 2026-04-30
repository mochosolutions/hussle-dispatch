import { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  TextField,
} from '@mui/material';

import { BodyStrong, Meta, SectionTitle } from 'components/Typography';
import { signDocument } from 'utils/api/fleet/carrierPortalApi';

import { SignatureCanvas } from '../SignatureCanvas';

interface DocumentSigningFlowProps {
  onComplete: () => void;
  token: string;
}

interface SubmitError { message: string }

const isErrorWithMessage = (error: unknown): error is SubmitError =>
  typeof error === 'object' && error !== null && 'message' in error;

export const DocumentSigningFlow: React.FC<DocumentSigningFlowProps> = ({ onComplete, token }) => {
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitDisabled = !signatureBase64 || !consentGiven || isSubmitting;

  const handleSignatureChange = useCallback((base64: string | null) => {
    setSignatureBase64(base64);
  }, []);

  const handleConsentChange = useCallback((_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setConsentGiven(checked);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!signatureBase64) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await signDocument(token, 'DISPATCH_AGREEMENT', {
        signatureData: signatureBase64,
        consentGiven,
        signerName: signerName || undefined,
        signerTitle: signerTitle || undefined,
      });
      onComplete();
    } catch (err: unknown) {
      const message = isErrorWithMessage(err) ? err.message : 'Failed to sign document';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [signatureBase64, consentGiven, signerName, signerTitle, token, onComplete]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <SectionTitle>Dispatch Agreement</SectionTitle>

      {/* Scrollable agreement text */}
      <Box
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          bgcolor: 'grey.50',
        }}
      >
        <Meta>Dispatch Agreement terms will be displayed here...</Meta>
      </Box>

      {/* Signer info */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Signer Name"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Signer Title"
          value={signerTitle}
          onChange={(e) => setSignerTitle(e.target.value)}
          fullWidth
        />
      </Box>

      {/* Signature */}
      <Box>
        <BodyStrong sx={{ mb: 1 }}>Signature</BodyStrong>
        <SignatureCanvas onSignatureChange={handleSignatureChange} />
      </Box>

      {/* E-SIGN consent */}
      <FormControlLabel
        control={<Checkbox checked={consentGiven} onChange={handleConsentChange} />}
        label="I agree to conduct this transaction electronically under the E-SIGN Act"
      />

      {error && <Alert severity="error">{error}</Alert>}

      {/* Submit */}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Signing...' : 'Sign Agreement'}
      </Button>
    </Box>
  );
};
