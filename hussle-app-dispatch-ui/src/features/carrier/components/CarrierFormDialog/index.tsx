import type React from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { SectionLabel } from 'components/Typography';
import {
  CheckboxField,
  CurrencyField,
  DateField,
  EmailField,
  PercentField,
  PhoneField,
  SelectField,
  StateField,
  TextField,
  ZipCodeField,
} from '@mocho/ui/components';
import type { Carrier, DispatchFeeType } from '../../types';
import { carrierEditSchema } from '../../validators/carrierSchema';
import type { CarrierEditFormValues } from '../../validators/carrierSchema';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';

interface CarrierFormDrawerProps {
  open: boolean;
  onClose: () => void;
  carrier?: Carrier;
  onSubmit: (values: CarrierEditFormValues) => void;
}

const TYPE_OPTIONS = [
  { value: 'COMPANY_ASSET', label: 'Company Asset' },
  { value: 'EXTERNAL_CARRIER', label: 'External Carrier' },
  { value: 'LEASED_CARRIER', label: 'Leased Carrier' },
];

const FEE_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'FLAT', label: 'Flat' },
];

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
    companyMarginPercent: carrier?.companyMarginPercent ?? 10,
    dispatchFeeType: (carrier?.dispatchFeeType ?? 'PERCENTAGE') as DispatchFeeType,
    dispatchFeeAmount: carrier?.dispatchFeeAmount ?? 0,
    feeIncludesAccessorials: carrier?.feeIncludesAccessorials ?? true,
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
          <SectionLabel sx={{ display: 'block' }}>
            Basic Info
          </SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 2 }}>
              <TextField name="name" label="Name" formik={formik} required />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SelectField name="type" label="Type" data={TYPE_OPTIONS} formik={formik} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField name="mcNumber" label="MC Number" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField name="dotNumber" label="DOT Number" formik={formik} />
            </Box>
          </Box>

          <Divider />

          <SectionLabel sx={{ display: 'block' }}>
            Contact
          </SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <PhoneField name="phone" label="Phone" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <EmailField name="email" label="Email" formik={formik} />
            </Box>
          </Box>
          <TextField name="address" label="Address" formik={formik} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 5 }}>
              <TextField name="city" label="City" formik={formik} />
            </Box>
            <Box sx={{ flex: 4 }}>
              <StateField name="state" label="State" formik={formik} />
            </Box>
            <Box sx={{ flex: 3 }}>
              <ZipCodeField name="zip" label="ZIP" formik={formik} />
            </Box>
          </Box>

          <Divider />

          <SectionLabel sx={{ display: 'block' }}>
            Financial
          </SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <SelectField
                name="dispatchFeeType"
                label="Fee Type"
                data={FEE_TYPE_OPTIONS}
                formik={formik}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              {formik.values.dispatchFeeType === 'FLAT' ? (
                <CurrencyField
                  name="dispatchFeeAmount"
                  label="Dispatch Fee Amount"
                  formik={formik}
                />
              ) : (
                <PercentField
                  name="companyMarginPercent"
                  label="Company Margin %"
                  formik={formik}
                />
              )}
            </Box>
          </Box>
          <CheckboxField
            name="feeIncludesAccessorials"
            label="Fee Includes Accessorials"
            formik={formik}
          />

          <Divider />

          <SectionLabel sx={{ display: 'block' }}>
            Onboarding
          </SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <CheckboxField
                name="dispatchAgreementOnFile"
                label="Dispatch Agreement on File"
                formik={formik}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <CheckboxField
                name="insuranceCertOnFile"
                label="Insurance Certificate on File"
                formik={formik}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <CheckboxField name="w9OnFile" label="W-9 on File" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <CheckboxField
                name="carrierPacketOnFile"
                label="Carrier Packet on File"
                formik={formik}
              />
            </Box>
          </Box>
          <DateField name="insuranceExpiry" label="Insurance Expiry" formik={formik} />

          <Divider />

          <SectionLabel sx={{ display: 'block' }}>
            Notes
          </SectionLabel>
          <TextField name="notes" label="Notes" formik={formik} />
        </Stack>
      )}
    </FormDrawer>
  );
};

export default CarrierFormDrawer;
