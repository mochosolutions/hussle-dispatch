import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} aria-labelledby="confirm-delete-dialog-title">
    <DialogTitle id="confirm-delete-dialog-title">
      <Stack direction="row" alignItems="center" spacing={1}>
        <WarningAmberIcon color="warning" />
        <Typography variant="h6">{title}</Typography>
      </Stack>
    </DialogTitle>
    <DialogContent>
      <DialogContentText color="error.main">{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} color="inherit" variant="outlined">
        {cancelLabel}
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDeleteDialog;
