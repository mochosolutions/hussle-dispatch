import type React from 'react';
import { Stack, Typography } from '@mui/material';

interface KpiGroupProps {
  label: string;
  children: React.ReactNode;
}

export const KpiGroup: React.FC<KpiGroupProps> = ({ label, children }) => (
  <Stack spacing={1}>
    <Typography
      variant="overline"
      sx={{ fontSize: '0.625rem', color: 'grey.500', letterSpacing: 1 }}
    >
      {label}
    </Typography>
    <Stack direction="row" spacing={2}>
      {children}
    </Stack>
  </Stack>
);
