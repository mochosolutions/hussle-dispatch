import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  WarningAmber as WarningAmberIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

/**
 * Props for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Dialog title */
  title: string;

  /** Dialog message/description */
  message?: string;

  /** Dialog content (alternative to message) */
  content?: string | React.ReactNode;

  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string;
  confirmText?: string; // Alias for confirmLabel

  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  cancelText?: string; // Alias for cancelLabel

  /** Severity level that determines icon and color (default: "warning") */
  severity?: 'error' | 'warning' | 'info';

  /** Callback when user confirms */
  onConfirm: () => void;

  /** Callback when dialog closes */
  onClose: () => void;
}

/**
 * Generic Confirmation Dialog Component
 *
 * A reusable confirmation dialog that supports different severity levels
 * and callback-based confirmation handling.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Delete Item"
 *   content="Are you sure you want to delete this item?"
 *   confirmText="Delete"
 *   severity="error"
 *   onConfirm={() => {
 *     deleteItem();
 *     setOpen(false);
 *   }}
 * />
 * ```
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  content,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  severity = 'warning',
  onConfirm,
  onClose,
}) => {
  const confirmButtonText = confirmText || confirmLabel || 'Confirm';
  const cancelButtonText = cancelText || cancelLabel || 'Cancel';
  const dialogContent = content || message;

  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    onConfirm();
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    onClose();
  };

  /**
   * Handle dialog close events (backdrop click, escape key)
   */
  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    // Allow backdrop clicks and escape key to close the dialog
    onClose();
  };

  // Select icon based on severity
  const Icon = severity === 'error'
    ? ErrorIcon
    : severity === 'info'
    ? InfoIcon
    : WarningAmberIcon;

  // Select color based on severity
  const iconColor = severity === 'error'
    ? 'error'
    : severity === 'info'
    ? 'info'
    : 'warning';

  const buttonColor = severity === 'error' ? 'error' : 'warning';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          <Icon color={iconColor} />
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {dialogContent}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCancel}
          variant="outlined"
          color="inherit"
        >
          {cancelButtonText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={buttonColor}
          autoFocus
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
