import { useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Button } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'store';
import { inviteMemberRequest } from '../../store/reducers/teamSlice';
import type { RootState } from 'store';

interface InviteMemberDialogProps {
  onClose: () => void;
  organizationId: string;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'driver', label: 'Driver' },
] as const;

const inviteSchema = Yup.object().shape({
  firstName: Yup.string().min(1).required('First name is required'),
  lastName: Yup.string().min(1).required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string()
    .oneOf(['admin', 'dispatcher', 'viewer', 'driver'])
    .required('Role is required'),
});

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  onClose,
  organizationId: _organizationId,
}) => {
  const dispatch = useDispatch();
  const inviteLoading = useSelector(
    (state: RootState) => state.pages.team.loading.invite,
  );
  const inviteError = useSelector(
    (state: RootState) => state.pages.team.errors.invite,
  );

  const prevLoadingRef = useRef(inviteLoading);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'dispatcher',
    },
    validationSchema: inviteSchema,
    validateOnMount: false,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: (values) => {
      dispatch(inviteMemberRequest(values));
    },
  });

  const resetFormRef = useRef(formik.resetForm);
  resetFormRef.current = formik.resetForm;

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = inviteLoading;

    if (wasLoading && !inviteLoading && !inviteError) {
      resetFormRef.current();
      onClose();
    }
  }, [inviteLoading, inviteError, onClose]);

  const handleClose = useCallback(() => {
    formik.resetForm();
    onClose();
  }, [formik.resetForm, onClose]);

  const isSubmitting = inviteLoading === 'Pending';

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Invite Team Member
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              autoFocus
              id="firstName"
              name="firstName"
              label="First Name"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.firstName && formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
              required
              fullWidth
            />
            <TextField
              id="lastName"
              name="lastName"
              label="Last Name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.lastName && formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
              required
              fullWidth
            />
            <TextField
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.email && formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              required
              fullWidth
            />
            <TextField
              id="role"
              name="role"
              label="Role"
              select
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(formik.touched.role && formik.errors.role)}
              helperText={formik.touched.role && formik.errors.role}
              required
              fullWidth
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            {inviteError && (
              <Alert severity="error" role="alert">
                {inviteError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            type="submit"
            loading={isSubmitting}
          >
            Send Invite
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};
