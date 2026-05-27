import type { ReactNode } from 'react';
import { Box, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { PageTitle } from 'components/Typography';

interface ListLayoutProps {
  title: string;
  primaryAction?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export const ListLayout: React.FC<ListLayoutProps> = ({
  title,
  primaryAction,
  toolbar,
  children,
  sx,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>
    {/* Topbar zone */}
    <Box
      sx={{
        bgcolor: 'background.paper',
        height: 56,
        borderBottom: '1px solid',
        borderColor: 'grey.200',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        px: { xs: 2, sm: 3 },
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
        <PageTitle>{title}</PageTitle>
        {primaryAction && <Box>{primaryAction}</Box>}
      </Stack>
    </Box>

    {/* Content area */}
    <Box sx={{ flex: 1, bgcolor: 'grey.100', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {toolbar && <Box>{toolbar}</Box>}
      {children}
    </Box>
  </Box>
);
