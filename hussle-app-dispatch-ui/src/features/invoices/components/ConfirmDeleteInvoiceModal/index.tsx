import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useDispatch } from 'store';
import { useSelector } from 'store';
import { deleteInvoiceRequest } from '../../store/reducers';
import { selectInvoiceById } from '../../store/selectors/invoiceSelectors';

interface ConfirmDeleteInvoiceModalProps {
  invoiceId: string;
  onClose: () => void;
}

export const ConfirmDeleteInvoiceModal: React.FC<ConfirmDeleteInvoiceModalProps> = ({
  invoiceId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const invoice = useSelector(selectInvoiceById(invoiceId));

  const handleConfirm = () => {
    dispatch(deleteInvoiceRequest({ id: invoiceId }));
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm">
      <DialogTitle>Delete Invoice</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete invoice {invoice?.invoiceNumber ?? invoiceId}? This action
          cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
