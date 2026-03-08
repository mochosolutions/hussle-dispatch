import type { FC, ReactNode } from 'react';

import { Box, Button, Divider, Stack, Typography } from '@mui/material';

interface InnerPageHeaderProps {
  onBack: () => void;
  backLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export const InnerPageHeader: FC<InnerPageHeaderProps> = ({
  onBack,
  backLabel,
  title,
  subtitle,
  actions,
}) => (
  <Box
    sx={{
      backgroundColor: 'background.paper',
      borderBottom: 1,
      borderColor: 'divider',
      px: { xs: 2, sm: 3 },
      py: 1.75,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}
  >
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={1.5}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button
            // variant="text"
            color="inherit"
            size="small"
            onClick={onBack}
            sx={{ minWidth: 0, px: 0, color: 'text.secondary' }}
          >
            ← {backLabel}
          </Button>
          <Divider orientation="vertical" flexItem />
          {typeof title === 'string' ? (
            <Typography variant="h4" color="text.primary">
              {title}
            </Typography>
          ) : (
            title
          )}
        </Stack>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {actions && (
        <Box
          sx={{
            width: { xs: '100%', md: 'auto' },
            display: 'flex',
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          {actions}
        </Box>
      )}
    </Stack>
  </Box>
);
