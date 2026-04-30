import { type ReactNode } from 'react';
import { Box, Card, Divider, type SxProps, type Theme } from '@mui/material';
import { Meta, SectionTitle } from 'components/Typography';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export const SectionCard = ({ title, subtitle, actions, children, sx }: SectionCardProps) => (
  <Card sx={{ mb: 2, ...sx }}>
    <Box
      sx={{
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <SectionTitle sx={{ color: 'text.primary' }}>{title}</SectionTitle>
        {subtitle && <Meta sx={{ display: 'block', mt: 0.25 }}>{subtitle}</Meta>}
      </Box>
      {actions}
    </Box>
    <Divider />
    <Box sx={{ px: 3, py: 2.5 }}>{children}</Box>
  </Card>
);
