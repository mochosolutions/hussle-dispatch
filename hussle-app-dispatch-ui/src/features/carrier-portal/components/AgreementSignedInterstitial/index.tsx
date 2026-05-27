import { useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

import { Body, BodyMuted, BodyStrong, PageTitle } from 'components/Typography';

export interface AgreementSignedInterstitialProps {
  signedAt: string | null;
  signedAgreementName: string;
  nextAgreementName?: string;
  onAutoAdvance?: () => void;
  onBackToList: () => void;
  /** Defaults to 2000ms. Set to 0 to disable auto-advance entirely. */
  autoAdvanceMs?: number;
}

const formatSignedAt = (signedAt: string | null): string => {
  if (!signedAt) return '';
  try {
    return format(parseISO(signedAt), 'PPpp');
  } catch {
    return signedAt;
  }
};

const AgreementSignedInterstitial: React.FC<AgreementSignedInterstitialProps> = ({
  signedAt,
  signedAgreementName,
  nextAgreementName,
  onAutoAdvance,
  onBackToList,
  autoAdvanceMs = 2000,
}) => {
  // Auto-advance only when a next agreement exists AND we have a callback.
  // Skipped on the final agreement so the user has time to confirm completion.
  useEffect(() => {
    if (!nextAgreementName || !onAutoAdvance || autoAdvanceMs <= 0) {
      return undefined;
    }
    const handle = window.setTimeout(() => {
      onAutoAdvance();
    }, autoAdvanceMs);
    return () => window.clearTimeout(handle);
  }, [nextAgreementName, onAutoAdvance, autoAdvanceMs]);

  const isFinal = !nextAgreementName;
  const formattedSignedAt = formatSignedAt(signedAt);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 520,
        mx: 'auto',
        my: { xs: 4, md: 6 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
        px: { xs: 3, md: 5 },
        py: { xs: 4, md: 5 },
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: 'success.main',
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          '& svg': { fontSize: 36 },
        }}
      >
        <CheckCircleOutline />
      </Box>

      <PageTitle sx={{ fontSize: 22, mb: 0.5 }}>Signed</PageTitle>
      <BodyStrong sx={{ display: 'block', fontSize: 14, mb: 0.5 }}>
        {signedAgreementName}
      </BodyStrong>
      {formattedSignedAt ? (
        <BodyMuted sx={{ fontSize: 12.5, mb: 3 }}>{formattedSignedAt}</BodyMuted>
      ) : (
        <Box sx={{ mb: 3 }} />
      )}

      {nextAgreementName ? (
        <Box
          sx={{
            display: 'inline-block',
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 0.75,
            px: 2,
            py: 1.25,
            mb: 2.5,
          }}
        >
          <Body sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Up next: <strong>{nextAgreementName}</strong>
          </Body>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: nextAgreementName ? 1 : 0 }}>
        <Button
          variant={isFinal ? 'contained' : 'outlined'}
          color="primary"
          onClick={onBackToList}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 13,
            px: 2.5,
            py: 1,
            borderRadius: 0.75,
          }}
        >
          Back to list
        </Button>
      </Box>
    </Box>
  );
};

export default AgreementSignedInterstitial;
