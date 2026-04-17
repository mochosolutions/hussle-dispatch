import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useDispatch } from 'store';
import { useSelector } from 'store';
import { sendInvoiceRequest } from '../../store/reducers';
import { selectInvoiceById } from '../../store/selectors/invoiceSelectors';

interface SendInvoiceModalProps {
  invoiceId: string;
  onClose: () => void;
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({ invoiceId, onClose }) => {
  const dispatch = useDispatch();
  const invoice = useSelector(selectInvoiceById(invoiceId));

  const [recipientEmail, setRecipientEmail] = useState(invoice?.sentTo ?? '');

  const handleSend = () => {
    if (!recipientEmail) {
      return;
    }
    dispatch(sendInvoiceRequest({ id: invoiceId, recipientEmail }));
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Invoice</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This will generate a PDF with all load documents and send it to the recipient.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          label="Recipient Email"
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSend} variant="contained" disabled={!recipientEmail}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};
