import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import { useFormik } from 'formik';

import { useDispatch } from 'store';
import type { VehicleType, VehicleOwnership } from 'features/carrier/types';

import { createVehicleRequest } from '../../store/reducers';
import { vehicleInfoSchema } from '../../validators/vehicleInfoSchema';
import { VEHICLE_TYPE_LABELS, OWNERSHIP_LABELS } from '../../constants';

interface VehicleCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

const vehicleTypeEntries = Object.entries(VEHICLE_TYPE_LABELS) as [VehicleType, string][];
const ownershipEntries = Object.entries(OWNERSHIP_LABELS) as [VehicleOwnership, string][];

export const VehicleCreateDialog: React.FC<VehicleCreateDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      carrierId: '',
      unitNumber: '',
      type: 'DRY_VAN' as VehicleType,
      ownership: 'OWNED' as VehicleOwnership,
      make: '',
      model: '',
      year: '',
      vin: '',
    },
    validationSchema: vehicleInfoSchema,
    enableReinitialize: true,
    onSubmit: (values, { resetForm }) => {
      const { carrierId, year, ...rest } = values;
      dispatch(
        createVehicleRequest({
          data: {
            ...rest,
            ...(carrierId ? { carrierId } : {}),
            ...(year ? { year: Number(year) } : {}),
          },
        }),
      );
      resetForm();
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
        <DialogTitle>Create Vehicle</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="carrierId"
                name="carrierId"
                label="Carrier ID"
                value={formik.values.carrierId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="unitNumber"
                name="unitNumber"
                label="Unit Number"
                value={formik.values.unitNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.unitNumber && formik.errors.unitNumber)}
                helperText={formik.touched.unitNumber && formik.errors.unitNumber}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="type"
                name="type"
                label="Vehicle Type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.type && formik.errors.type)}
                helperText={formik.touched.type && formik.errors.type}
                select
                fullWidth
                required
                size="small"
              >
                {vehicleTypeEntries.map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="ownership"
                name="ownership"
                label="Ownership"
                value={formik.values.ownership}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.ownership && formik.errors.ownership)}
                helperText={formik.touched.ownership && formik.errors.ownership}
                select
                fullWidth
                required
                size="small"
              >
                {ownershipEntries.map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="make"
                name="make"
                label="Make"
                value={formik.values.make}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="model"
                name="model"
                label="Model"
                value={formik.values.model}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="year"
                name="year"
                label="Year"
                type="number"
                value={formik.values.year}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.year && formik.errors.year)}
                helperText={formik.touched.year && formik.errors.year}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="vin"
                name="vin"
                label="VIN"
                value={formik.values.vin}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={formik.isSubmitting}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
