import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { EmailChipsField } from 'features/contact/components/EmailChipsField';
import { selectContactById } from 'features/contact/store/selectors/contactSelectors';
import { sendInvoiceRequest } from '../../store/reducers';
import { selectInvoiceById } from '../../store/selectors/invoiceSelectors';

interface SendInvoiceModalProps {
  invoiceId: string;
  recipientContactId?: string;
  onClose: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendInvoiceFormSchema = Yup.object({
  recipientEmail: Yup.string()
    .trim()
    .matches(EMAIL_PATTERN, 'Enter a valid email address')
    .required('Recipient email is required'),
  ccEmails: Yup.array()
    .of(Yup.string().trim().matches(EMAIL_PATTERN, 'Enter a valid email address').required())
    .default([]),
}).required();

interface SendInvoiceFormValues {
  recipientEmail: string;
  ccEmails: string[];
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  invoiceId,
  recipientContactId,
  onClose,
}) => {
  const dispatch = useDispatch();
  const invoice = useSelector(selectInvoiceById(invoiceId));
  const contact = useSelector(selectContactById(recipientContactId ?? ''));

  const formik = useFormik<SendInvoiceFormValues>({
    initialValues: {
      recipientEmail: invoice?.sentTo ?? '',
      ccEmails: contact?.ccEmails ?? [],
    },
    enableReinitialize: true,
    validationSchema: sendInvoiceFormSchema,
    onSubmit: (values) => {
      dispatch(
        sendInvoiceRequest({
          id: invoiceId,
          recipientEmail: values.recipientEmail.trim(),
          ccEmails: values.ccEmails,
        }),
      );
      onClose();
    },
  });

  const recipientError = formik.errors.recipientEmail;
  const recipientTouched = formik.touched.recipientEmail;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle>Send Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will generate a PDF with all load documents and send it to the recipient.
          </DialogContentText>
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              id="recipientEmail"
              name="recipientEmail"
              label="Recipient Email"
              type="email"
              value={formik.values.recipientEmail}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(recipientTouched && recipientError)}
              helperText={recipientTouched && recipientError ? recipientError : ' '}
            />
            <EmailChipsField
              name="ccEmails"
              label="CC"
              formik={formik}
              placeholder="Add CC emails"
              helperText="Press Enter to add an email"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formik.values.recipientEmail || formik.isSubmitting}
          >
            Send
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
