import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'store';
import { SubmitButton } from '@mocho/ui/components';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import { adminActivateCarrierRequest } from 'features/carrier/store/reducers/carrierNewPageSlice';

interface AdminActivateModalProps {
  carrierId: string;
  carrierName: string;
}

const adminActivateSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .required('Reason is required')
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must be 1000 characters or fewer'),
  evidenceDocumentId: yup.string().uuid('Must be a valid UUID').nullable(),
});

export const AdminActivateModal: React.FC<AdminActivateModalProps> = ({
  carrierId,
  carrierName,
}) => {
  const isOpen = useSelector(
    (state) => state.pages.ui?.modal?.modalType === 'adminActivateCarrier',
  );
  const { closeModal } = useModalActions();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: { reason: '', evidenceDocumentId: '' },
    validationSchema: adminActivateSchema,
    onSubmit: (values, { setSubmitting }) => {
      const evidenceDocumentId = values.evidenceDocumentId.trim();
      dispatch(
        adminActivateCarrierRequest({
          id: carrierId,
          reason: values.reason.trim(),
          ...(evidenceDocumentId.length > 0 && { evidenceDocumentId }),
        }),
      );
      setSubmitting(false);
    },
  });

  const handleClose = (_event: object, reason?: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick') {
      return;
    }
    closeModal();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Activate without onboarding</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This bypasses the standard onboarding flow for <strong>{carrierName}</strong>{' '}
            and marks them Active immediately. The action is audit-logged.
          </Alert>

          <form id="admin-activate-form" onSubmit={formik.handleSubmit}>
            <TextField
              name="reason"
              label="Reason"
              multiline
              rows={3}
              fullWidth
              required
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.reason && formik.errors.reason)}
              helperText={
                (formik.touched.reason && formik.errors.reason) ??
                `${formik.values.reason.length}/1000 — minimum 10 characters`
              }
              inputProps={{ maxLength: 1000 }}
              sx={{ mb: 2 }}
            />

            <TextField
              name="evidenceDocumentId"
              label="Evidence document ID (optional)"
              fullWidth
              value={formik.values.evidenceDocumentId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(
                formik.touched.evidenceDocumentId && formik.errors.evidenceDocumentId,
              )}
              helperText={
                (formik.touched.evidenceDocumentId && formik.errors.evidenceDocumentId) ??
                'UUID of an uploaded document supporting the override (e.g. paper agreement scan)'
              }
            />
          </form>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={closeModal} disabled={formik.isSubmitting}>
          Cancel
        </Button>
        <SubmitButton
          label="Activate Carrier"
          loading={formik.isSubmitting}
          disabled={!formik.isValid || !formik.dirty}
          fullWidth={false}
          size="medium"
          type="submit"
          form="admin-activate-form"
        />
      </DialogActions>
    </Dialog>
  );
};
