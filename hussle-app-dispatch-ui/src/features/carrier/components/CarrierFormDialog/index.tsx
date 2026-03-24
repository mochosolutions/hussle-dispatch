import type React from 'react';
import { Grid, Typography, Divider, Stack } from '@mui/material';
import {
  CheckboxField,
  DateField,
  SelectField,
  TextField,
} from '@mocho/ui/components';
import type { Carrier } from '../../types';
import { carrierEditSchema } from '../../validators/carrierSchema';
import type { CarrierEditFormValues } from '../../validators/carrierSchema';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';

interface CarrierFormDrawerProps {
  open: boolean;
  onClose: () => void;
  carrier?: Carrier;
  onSubmit: (values: CarrierEditFormValues) => void;
}

// OWNER_OPERATOR excluded per decision L-010
const TYPE_OPTIONS = [
  { value: 'COMPANY_ASSET', label: 'Company Asset' },
  { value: 'EXTERNAL_CARRIER', label: 'External Carrier' },
];

const sectionLabelSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

export const CarrierFormDrawer: React.FC<CarrierFormDrawerProps> = ({
  open,
  onClose,
  carrier,
  onSubmit,
}) => {
  const isEditMode = carrier !== undefined;

  const initialValues = {
    name: carrier?.name ?? '',
    type: carrier?.type ?? 'EXTERNAL_CARRIER',
    mcNumber: carrier?.mcNumber ?? '',
    dotNumber: carrier?.dotNumber ?? '',
    phone: carrier?.phone ?? '',
    email: carrier?.email ?? '',
    address: carrier?.address ?? '',
    city: carrier?.city ?? '',
    state: carrier?.state ?? '',
    zip: carrier?.zip ?? '',
    dispatchFeePercent: carrier?.dispatchFeePercent ?? 10,
    partnerSplitPercent: carrier?.partnerSplitPercent ?? 50,
    feeIncludesAccessorials: carrier?.feeIncludesAccessorials ?? false,
    dispatchAgreementOnFile: carrier?.dispatchAgreementOnFile ?? false,
    insuranceCertOnFile: carrier?.insuranceCertOnFile ?? false,
    w9OnFile: carrier?.w9OnFile ?? false,
    carrierPacketOnFile: carrier?.carrierPacketOnFile ?? false,
    insuranceExpiry: carrier?.insuranceExpiry ? new Date(carrier.insuranceExpiry) : null,
    notes: carrier?.notes ?? '',
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Carrier' : 'Add Carrier'}
      subtitle={carrier?.name}
      initialValues={initialValues}
      validationSchema={carrierEditSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
      saveLabel={isEditMode ? 'Save Changes' : 'Add Carrier'}
      savingLabel={isEditMode ? 'Saving…' : 'Creating…'}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Basic Info
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField name="name" label="Name" formik={formik} required />
            </Grid>
            <Grid item xs={12} md={4}>
              <SelectField name="type" label="Type" data={TYPE_OPTIONS} formik={formik} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="mcNumber" label="MC Number" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="dotNumber" label="DOT Number" formik={formik} />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <TextField name="email" label="Email" formik={formik} />
            </Grid>
          </Grid>
          <TextField name="address" label="Address" formik={formik} />
          <Grid container spacing={2}>
            <Grid item xs={5}>
              <TextField name="city" label="City" formik={formik} />
            </Grid>
            <Grid item xs={4}>
              <TextField name="state" label="State" formik={formik} />
            </Grid>
            <Grid item xs={3}>
              <TextField name="zip" label="ZIP" formik={formik} />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Financial
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField name="dispatchFeePercent" label="Dispatch Fee %" type="number" formik={formik} />
            </Grid>
            <Grid item xs={4}>
              <TextField name="partnerSplitPercent" label="Partner Split %" type="number" formik={formik} />
            </Grid>
            <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckboxField
                name="feeIncludesAccessorials"
                label="Fee Includes Accessorials"
                formik={formik}
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Onboarding
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <CheckboxField
                name="dispatchAgreementOnFile"
                label="Dispatch Agreement on File"
                formik={formik}
              />
            </Grid>
            <Grid item xs={6}>
              <CheckboxField
                name="insuranceCertOnFile"
                label="Insurance Certificate on File"
                formik={formik}
              />
            </Grid>
            <Grid item xs={6}>
              <CheckboxField name="w9OnFile" label="W-9 on File" formik={formik} />
            </Grid>
            <Grid item xs={6}>
              <CheckboxField
                name="carrierPacketOnFile"
                label="Carrier Packet on File"
                formik={formik}
              />
            </Grid>
            <Grid item xs={6}>
              <DateField name="insuranceExpiry" label="Insurance Expiry" formik={formik} />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" sx={sectionLabelSx}>
            Notes
          </Typography>
          <TextField name="notes" label="Notes" formik={formik} />
        </Stack>
      )}
    </FormDrawer>
  );
};

export default CarrierFormDrawer;
