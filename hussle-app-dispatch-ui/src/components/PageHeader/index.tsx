import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

/** Page header with title, optional subtitle, and action buttons. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, headerActions }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {headerActions && <Box>{headerActions}</Box>}
    </Box>
  );
};
