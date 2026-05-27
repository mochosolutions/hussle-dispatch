import React from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';

export const SessionExpiredPortalScreen: React.FC = () => (
  <Box
    data-testid="portal-session-expired"
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2,
      py: 4,
      bgcolor: 'background.default',
    }}
  >
    <Card sx={{ maxWidth: 480, width: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" component="h1">
            Your session has expired
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Magic-link portal sessions are time-limited for security. Request a new link to
            continue where you left off.
          </Typography>
          <Button
            variant="contained"
            // TODO: wire to magic-link resend flow once that endpoint exists. For now
            // the button is informational — closing/reopening the original email link
            // re-issues a session.
            disabled
            fullWidth
          >
            Request a new link
          </Button>
        </Stack>
      </CardContent>
    </Card>
  </Box>
);

export default SessionExpiredPortalScreen;
