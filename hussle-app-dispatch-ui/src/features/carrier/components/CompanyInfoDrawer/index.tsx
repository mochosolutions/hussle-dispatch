import React from 'react';
import { Divider, Grid, Stack, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField, EmailField } from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { companyInfoSchema } from '../../validators/fleetSchema';
import { selectCarrierById } from '../../store/selectors/carrierSelectors';
import { updateCarrierRequest } from '../../store/reducers';

interface CompanyInfoDrawerProps {
  carrierId: string;
  onClose: () => void;
}

export const CompanyInfoDrawer: React.FC<CompanyInfoDrawerProps> = ({ carrierId, onClose }) => {
  const dispatch = useDispatch();
  const carrier = useSelector(selectCarrierById(carrierId));

  if (!carrier) {
    return null;
  }

  const initialValues = {
    name: carrier.name,
    mcNumber: carrier.mcNumber ?? '',
    dotNumber: carrier.dotNumber ?? '',
    ein: carrier.ein ?? '',
    phone: carrier.phone ?? '',
    email: carrier.email ?? '',
    address: carrier.address ?? '',
    city: carrier.city ?? '',
    state: carrier.state ?? '',
    zip: carrier.zip ?? '',
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Company Information"
      subtitle={carrier.name}
      initialValues={initialValues}
      validationSchema={companyInfoSchema}
      onSubmit={(values) => {
        dispatch(updateCarrierRequest({ id: carrierId, data: values }));
      }}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.6875rem',
              letterSpacing: 0.5,
            }}
          >
            Company Details
          </Typography>
          <TextField name="name" label="Legal Name" formik={formik} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="mcNumber" label="MC Number" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="dotNumber" label="DOT Number" formik={formik} />
            </Grid>
          </Grid>
          <TextField name="ein" label="EIN" formik={formik} />
          <TextField name="address" label="Address" formik={formik} />
          <Grid container spacing={2}>
            <Grid item xs={5}>
              <TextField name="city" label="City" formik={formik} />
            </Grid>
            <Grid item xs={3}>
              <TextField name="state" label="State" formik={formik} />
            </Grid>
            <Grid item xs={4}>
              <TextField name="zip" label="ZIP" formik={formik} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.6875rem',
              letterSpacing: 0.5,
            }}
          >
            Primary Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <EmailField name="email" label="Email" formik={formik} />
            </Grid>
          </Grid>
        </Stack>
      )}
    </FormDrawer>
  );
};
