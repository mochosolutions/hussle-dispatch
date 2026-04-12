import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { deleteLoadRequest } from 'features/load/store/reducers';
import { closeModal } from 'features/ui/store/reducers/uiSlice';

export const ConfirmDeleteLoadDialog = ({
  // open,
  // onClose,
  loadId,
  loadNumber,
}: {
  open: boolean;
  // onClose: () => void;
  loadNumber: string;
  loadId: string;
}) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(
    (state) => state.pages.ui?.modal?.modalType === 'confirmDeleteLoadDialog',
  );

  const handleClose = (_event: object, reason?: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick') {
      return;
    }
    dispatch(closeModal());
  };

  const handleConfirm = () => {
    dispatch(deleteLoadRequest({ id: loadId }));
    dispatch(closeModal());
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Load</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete load {loadNumber}? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
