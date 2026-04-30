import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'store';
import { SubmitButton } from '@mocho/ui/components';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import axiosInstance from 'utils/axios';
import { notify } from 'features/ui/store/reducers/notificationSlice';

interface DispatchOverrideModalProps {
  carrierId: string;
  carrierName: string;
  loadId: string;
  missingDocuments: string[];
}

const overrideSchema = yup.object({
  reason: yup
    .string()
    .required('Reason is required')
    .max(1000, 'Reason must be 1000 characters or fewer'),
});

export const DispatchOverrideModal: React.FC<DispatchOverrideModalProps> = ({
  carrierId,
  carrierName,
  loadId,
  missingDocuments,
}) => {
  const isOpen = useSelector(
    (state) => state.pages.ui?.modal?.modalType === 'dispatchOverride',
  );
  const { closeModal } = useModalActions();
  const dispatch = useDispatch();
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { reason: '' },
    validationSchema: overrideSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        await axiosInstance.post(`/carriers/${carrierId}/dispatch-override`, {
          loadId,
          reason: values.reason,
        });
        closeModal();
        dispatch(notify({ message: 'Dispatch override applied successfully', variant: 'success' }));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to apply dispatch override';
        setApiError(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = (_event: object, reason?: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick') {
      return;
    }
    closeModal();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Override Onboarding Requirement</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
            The following onboarding requirements are not met for{' '}
            <strong>{carrierName}</strong>:
          </Alert>

          <List dense disablePadding sx={{ mb: 2 }}>
            {missingDocuments.map((doc) => (
              <ListItem key={doc} disableGutters sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 8, color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText primary={doc} />
              </ListItem>
            ))}
          </List>

          <form id="dispatch-override-form" onSubmit={formik.handleSubmit}>
            <TextField
              name="reason"
              label="Reason for override"
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
                `${formik.values.reason.length}/1000`
              }
              inputProps={{ maxLength: 1000 }}
            />
          </form>

          {apiError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {apiError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={formik.isSubmitting}>
          Cancel
        </Button>
        <SubmitButton
          label="Dispatch Anyway"
          loading={formik.isSubmitting}
          disabled={!formik.isValid || !formik.dirty}
          fullWidth={false}
          size="medium"
          type="submit"
          form="dispatch-override-form"
        />
      </DialogActions>
    </Dialog>
  );
};
