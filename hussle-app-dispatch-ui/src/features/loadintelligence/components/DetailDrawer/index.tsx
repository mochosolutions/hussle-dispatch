import React from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { DrawerTitle, Meta } from 'components/Typography';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        width: { xs: '100%', sm: 520 },
        bgcolor: 'grey.50',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      },
    }}
  >
    <Box
      sx={{
        px: 3,
        py: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <Box>
        <DrawerTitle>{title}</DrawerTitle>
        {subtitle && <Meta sx={{ color: 'text.primary' }}>{subtitle}</Meta>}
      </Box>
      <IconButton onClick={onClose} size="small" aria-label="Close drawer">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto' }}>{children}</Box>
    {footer && (
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {footer}
      </Box>
    )}
  </Drawer>
);
