import React from 'react';
import { Grid, Typography, Divider, Stack } from '@mui/material';
import { TextField } from '@mocho/ui/components';
import { useDispatch } from 'store';
import { createDriverRequest } from '../../store/reducers';
import { driverInfoSchema } from '../../validators/driverInfoSchema';
import CarrierAutocomplete from 'features/carrier/components/CarrierAutocomplete';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';

interface DriverCreateDrawerProps {
  onClose: () => void;
  initialCarrierId?: string;
}

const sectionLabelSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

const INITIAL_VALUES = {
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

export const DriverCreateDrawer: React.FC<DriverCreateDrawerProps> = ({
  onClose,
  initialCarrierId,
}) => {
  const dispatch = useDispatch();

  const initialValues = initialCarrierId
    ? { ...INITIAL_VALUES, carrierId: initialCarrierId }
    : INITIAL_VALUES;

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Create Driver"
      initialValues={initialValues}
      validationSchema={driverInfoSchema}
      onSubmit={(values) => {
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
      }}
      saveLabel="Create"
      savingLabel="Creating…"
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <CarrierAutocomplete
            value={formik.values.carrierId}
            onChange={(carrierId) => {
              void formik.setFieldValue('carrierId', carrierId);
            }}
            onBlur={() => {
              void formik.setFieldTouched('carrierId', true);
            }}
            label="Carrier"
          />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Personal Info
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="firstName" label="First Name" formik={formik} required />
            </Grid>
            <Grid item xs={6}>
              <TextField name="lastName" label="Last Name" formik={formik} required />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="email" label="Email" formik={formik} />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            CDL Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="cdlNumber" label="CDL Number" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="cdlState" label="CDL State" formik={formik} />
            </Grid>
          </Grid>
          <TextField name="cdlExpiry" label="CDL Expiry" formik={formik} />

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Home Base
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="homeBaseCity" label="City" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="homeBaseState" label="State" formik={formik} />
            </Grid>
          </Grid>
        </Stack>
      )}
    </FormDrawer>
  );
};
