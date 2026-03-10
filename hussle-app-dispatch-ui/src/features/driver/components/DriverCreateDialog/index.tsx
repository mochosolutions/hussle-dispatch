import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  Divider,
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
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  cdlNumber: string;
  cdlState: string;
  cdlExpiry: string;
  homeBaseCity: string;
  homeBaseState: string;
}

const INITIAL_VALUES: DriverCreateFormValues = {
  carrierId: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  cdlNumber: '',
  cdlState: '',
  cdlExpiry: '',
  homeBaseCity: '',
  homeBaseState: '',
};

const sectionLabelSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

export const DriverCreateDialog: React.FC<DriverCreateDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const formik = useFormik<DriverCreateFormValues>({
    initialValues: INITIAL_VALUES,
    validationSchema: driverInfoSchema,
    onSubmit: (values) => {
      dispatch(
        createDriverRequest({
          data: {
            ...values,
            carrierId: values.carrierId || null,
            homeBaseCity: values.homeBaseCity || null,
            homeBaseState: values.homeBaseState || null,
          },
        }),
      );
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

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Personal Info
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="firstName"
                name="firstName"
                label="First Name"
                required
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.firstName && formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="lastName"
                name="lastName"
                label="Last Name"
                required
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.lastName && formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
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

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                CDL Information
              </Typography>
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

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={sectionLabelSx}>
                Home Base
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="homeBaseCity"
                name="homeBaseCity"
                label="City"
                value={formik.values.homeBaseCity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.homeBaseCity && formik.errors.homeBaseCity)}
                helperText={formik.touched.homeBaseCity && formik.errors.homeBaseCity}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="homeBaseState"
                name="homeBaseState"
                label="State"
                value={formik.values.homeBaseState}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.homeBaseState && formik.errors.homeBaseState)}
                helperText={formik.touched.homeBaseState && formik.errors.homeBaseState}
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
