import React, { useState } from 'react';
import { Box, Typography, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmDialog from '../../../../mocho/components/ConfirmDialog';

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
            <Typography variant="h5">{title}</Typography>
            {subtitle && <Typography variant="caption">{subtitle}</Typography>}
          </Box>
          <IconButton onClick={handleClose} size="small" aria-label="Close drawer">
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
