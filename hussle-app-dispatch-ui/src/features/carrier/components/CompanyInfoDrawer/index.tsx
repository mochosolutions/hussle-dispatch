import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import { Box, Typography, Button, Divider, Grid, Stack, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField, EmailField } from '../../../../mocho/components';
import { EditDrawer } from '../../components/EditDrawer';
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

  return (
    <Formik
      initialValues={{
        name: carrier.name,
        mcNumber: carrier.mcNumber ?? '',
        dotNumber: carrier.dotNumber ?? '',
        phone: carrier.phone ?? '',
        email: carrier.email ?? '',
        address: carrier.address ?? '',
        city: carrier.city ?? '',
        state: carrier.state ?? '',
        zip: carrier.zip ?? '',
      }}
      validationSchema={companyInfoSchema}
      onSubmit={(values, { setSubmitting }) => {
        dispatch(updateCarrierRequest({ id: carrierId, data: values }));
        setSubmitting(false);
        onClose();
      }}
      enableReinitialize
    >
      <CompanyInfoDrawerContent carrierName={carrier.name} onClose={onClose} />
    </Formik>
  );
};

interface CompanyInfoDrawerContentProps {
  carrierName: string;
  onClose: () => void;
}

const CompanyInfoDrawerContent: React.FC<CompanyInfoDrawerContentProps> = ({
  carrierName,
  onClose,
}) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, isValid, dirty } =
    useFormikContext<Record<string, unknown>>();

  const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="edit-company-info"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Saving\u2026' : 'Save Changes'}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      title="Edit Company Information"
      onClose={onClose}
      subtitle={carrierName}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="edit-company-info">
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
          <TextField name="name" label="Legal Name" formik={formikProps} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="mcNumber" label="MC Number" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="dotNumber" label="DOT Number" formik={formikProps} />
            </Grid>
          </Grid>
          <TextField name="address" label="Address" formik={formikProps} />
          <Grid container spacing={2}>
            <Grid item xs={5}>
              <TextField name="city" label="City" formik={formikProps} />
            </Grid>
            <Grid item xs={3}>
              <TextField name="state" label="State" formik={formikProps} />
            </Grid>
            <Grid item xs={4}>
              <TextField name="zip" label="ZIP" formik={formikProps} />
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
            Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <EmailField name="email" label="Email" formik={formikProps} />
            </Grid>
          </Grid>
        </Stack>
      </Form>
    </EditDrawer>
  );
};
