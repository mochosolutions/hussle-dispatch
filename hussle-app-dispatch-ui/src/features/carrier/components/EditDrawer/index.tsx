import React from 'react';
import { Box, Typography, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const EditDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, children }) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: { width: { xs: '100%', sm: 480 }, bgcolor: 'grey.50' },
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
        <Typography variant="h5">{title}</Typography>
        {subtitle && <Typography variant="caption">{subtitle}</Typography>}
      </Box>
      <IconButton onClick={onClose} size="small">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
    <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>{children}</Box>
  </Drawer>
);
