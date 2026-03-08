import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';

import { useDispatch } from 'store';
import { createDriverRequest } from '../../store/reducers';
import { driverInfoSchema } from '../../validators/driverInfoSchema';

interface DriverCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

interface DriverCreateFormValues {
  carrierId: string;
  name: string;
  phone: string;
  email: string;
  cdlNumber: string;
  cdlState: string;
  cdlExpiry: string;
}

const INITIAL_VALUES: DriverCreateFormValues = {
  carrierId: '',
  name: '',
  phone: '',
  email: '',
  cdlNumber: '',
  cdlState: '',
  cdlExpiry: '',
};

export const DriverCreateDialog: React.FC<DriverCreateDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const formik = useFormik<DriverCreateFormValues>({
    initialValues: INITIAL_VALUES,
    validationSchema: driverInfoSchema,
    onSubmit: (values) => {
      dispatch(createDriverRequest({ data: values }));
      onClose();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>Create Driver</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                id="carrierId"
                name="carrierId"
                label="Carrier ID"
                value={formik.values.carrierId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="name"
                name="name"
                label="Name"
                required
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.name && formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="phone"
                name="phone"
                label="Phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.phone && formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="email"
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.email && formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="cdlNumber"
                name="cdlNumber"
                label="CDL Number"
                value={formik.values.cdlNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.cdlNumber && formik.errors.cdlNumber)}
                helperText={formik.touched.cdlNumber && formik.errors.cdlNumber}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="cdlState"
                name="cdlState"
                label="CDL State"
                value={formik.values.cdlState}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.cdlState && formik.errors.cdlState)}
                helperText={formik.touched.cdlState && formik.errors.cdlState}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="cdlExpiry"
                name="cdlExpiry"
                label="CDL Expiry"
                type="date"
                value={formik.values.cdlExpiry}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.cdlExpiry && formik.errors.cdlExpiry)}
                helperText={formik.touched.cdlExpiry && formik.errors.cdlExpiry}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
