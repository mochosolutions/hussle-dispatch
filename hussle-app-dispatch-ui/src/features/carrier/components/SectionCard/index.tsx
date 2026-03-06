import { type ReactNode } from 'react';
import { Box, Card, Divider, Typography, type SxProps, type Theme } from '@mui/material';

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
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions}
    </Box>
    <Divider />
    <Box sx={{ px: 3, py: 2.5 }}>{children}</Box>
  </Card>
);
