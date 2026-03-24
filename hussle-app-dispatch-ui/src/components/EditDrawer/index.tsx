import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Typography, Drawer, IconButton, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmDialog from '../../mocho/components/ConfirmDialog';
import { SectionLabel } from 'components/Typography';

export const EditDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isDirty?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, subtitle, isDirty, children, footer }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => {
    if (isDirty) {
      setShowConfirm(true);
      return;
    }
    onClose();
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480 },
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
        }}
      >
        {/* Navy header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: 'primary.dark',
            borderBottom: '1px solid',
            borderColor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ color: 'common.white' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label="Close drawer"
            sx={{
              color: 'common.white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              width: 28,
              height: 28,
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>{children}</Box>

        {/* Footer */}
        {footer && (
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: 'grey.100',
              borderTop: 1,
              borderColor: 'divider',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
              flexShrink: 0,
            }}
          >
            {footer}
          </Box>
        )}
      </Drawer>
      <ConfirmDialog
        open={showConfirm}
        title="Discard unsaved changes?"
        content="You have unsaved changes that will be lost if you close this drawer."
        confirmText="Discard"
        cancelText="Keep Editing"
        severity="warning"
        onConfirm={handleConfirmDiscard}
        onClose={handleCancelDiscard}
      />
    </>
  );
};

// ==============================|| DRAWER SECTION ||============================== //

interface DrawerSectionProps {
  label: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export const DrawerSection: React.FC<DrawerSectionProps> = ({ label, children, sx }) => (
  <Stack spacing={2.5} sx={sx}>
    <SectionLabel sx={{ color: 'grey.400' }}>{label}</SectionLabel>
    {children}
  </Stack>
);
