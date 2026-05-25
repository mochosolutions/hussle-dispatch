import type React from 'react';
import { useFormik } from 'formik';
import { Grid, Divider } from '@mui/material';
import { SectionLabel } from 'components/Typography';
import {
  CheckboxField,
  LoadingButton,
  SelectField,
  TextField,
} from '@mocho/ui/components';
import type { Carrier } from '../../types';
import { carrierEditSchema } from '../../validators/carrierSchema';
import type { CarrierEditFormValues } from '../../validators/carrierSchema';

interface CarrierFormDialogProps {
  open: boolean;
  onClose: () => void;
  carrier?: Carrier;
  isLoading: boolean;
  onSubmit: (values: CarrierEditFormValues) => void;
}

const TYPE_OPTIONS = [
  { value: 'COMPANY_ASSET', label: 'Company Asset' },
  { value: 'EXTERNAL_CARRIER', label: 'External Carrier' },
  { value: 'LEASED_CARRIER', label: 'Leased Carrier' },
];

export const CarrierFormDialog: React.FC<CarrierFormDialogProps> = ({
  carrier,
  //   isLoading,
  onSubmit,
}) => {
  const isEditMode = carrier !== undefined;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
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
      companyMarginPercent: carrier?.companyMarginPercent ?? 10,
      dispatchFeeType: carrier?.dispatchFeeType ?? 'PERCENTAGE',
      dispatchFeeAmount: carrier?.dispatchFeeAmount ?? 0,
      feeIncludesAccessorials: carrier?.feeIncludesAccessorials ?? false,
      notes: carrier?.notes ?? '',
    },
    validationSchema: carrierEditSchema,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  //   const handleClose = () => {
  //     formik.resetForm();
  //     onClose();
  //   };

  return (
    <form id="carrier-form" onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={2}>
        {/* Basic Info */}
        <Grid item xs={12}>
          <SectionLabel sx={{ mb: 1, display: 'block' }}>
            Basic Info
          </SectionLabel>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={8}>
          <TextField name="name" label="Name" formik={formik} required />
        </Grid>

        <Grid item xs={12} md={4}>
          <SelectField name="type" label="Type" data={TYPE_OPTIONS} formik={formik} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField name="mcNumber" label="MC Number" formik={formik} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField name="dotNumber" label="DOT Number" formik={formik} />
        </Grid>

        {/* Contact */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <SectionLabel sx={{ mb: 1, display: 'block' }}>
            Contact
          </SectionLabel>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField name="phone" label="Phone" formik={formik} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField name="email" label="Email" formik={formik} />
        </Grid>

        <Grid item xs={12}>
          <TextField name="address" label="Address" formik={formik} />
        </Grid>

        <Grid item xs={12} md={5}>
          <TextField name="city" label="City" formik={formik} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField name="state" label="State" formik={formik} />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField name="zip" label="ZIP" formik={formik} />
        </Grid>

        {/* Financial */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <SectionLabel sx={{ mb: 1, display: 'block' }}>
            Financial
          </SectionLabel>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField name="companyMarginPercent" label="Company Margin %" type="number" formik={formik} />
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckboxField
            name="feeIncludesAccessorials"
            label="Fee Includes Accessorials"
            formik={formik}
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <SectionLabel sx={{ mb: 1, display: 'block' }}>
            Notes
          </SectionLabel>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField name="notes" label="Notes" formik={formik} />
        </Grid>
      </Grid>
    </form>
  );
};

export default CarrierFormDialog;
