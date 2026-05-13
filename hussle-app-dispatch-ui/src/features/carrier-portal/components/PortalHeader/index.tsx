import { useEffect, useState } from 'react';
import { Box, Container } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

import { BrandName, Meta } from 'components/Typography';

interface PortalHeaderProps {
  savingAnswer: boolean;
  lastSavedAt: string | null;
}

const SAVED_VISIBLE_MS = 30_000;

const PortalHeader: React.FC<PortalHeaderProps> = ({ savingAnswer, lastSavedAt }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lastSavedAt) {
      return undefined;
    }
    const id = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  const savedRecently =
    lastSavedAt !== null && now - new Date(lastSavedAt).getTime() < SAVED_VISIBLE_MS;

  let status: React.ReactNode = null;
  if (savingAnswer) {
    status = <Meta sx={{ color: 'common.white', opacity: 0.75 }}>Auto-saving…</Meta>;
  } else if (savedRecently) {
    status = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <CheckCircleOutline sx={{ fontSize: 16, color: 'common.white', opacity: 0.85 }} />
        <Meta sx={{ color: 'common.white', opacity: 0.85 }}>Saved</Meta>
      </Box>
    );
  }

  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'primary.dark',
        color: 'common.white',
        height: 56,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <BrandName sx={{ fontSize: 18 }}>Hussle Dispatch</BrandName>
        {status}
      </Container>
    </Box>
  );
};

export default PortalHeader;
