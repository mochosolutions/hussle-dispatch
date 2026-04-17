import { Box, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { FormikProps } from 'formik';
import { TextField, SelectField, CurrencyField, NumericField } from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';
import ContactAutocomplete from 'features/contact/components/BrokerAutocomplete';
import CustomerAutocomplete from 'features/customer/components/CustomerAutocomplete';
import SectionCard from 'components/SectionCard';
import type { LoadFormValues } from '../../../../../validators/loadSchema';
import {
  EQUIPMENT_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  REEFER_MODE_OPTIONS,
  FLATBED_LENGTH_OPTIONS,
  TARP_TYPE_OPTIONS,
} from '../../../../../constants';

interface LoadDetailsSectionProps {
  formik: FormikProps<LoadFormValues>;
  complete?: boolean;
}

export const LoadDetailsSection: React.FC<LoadDetailsSectionProps> = ({ formik, complete }) => {
  const equipmentType = formik.values.equipmentType;
  const isReefer = equipmentType === 'REEFER';
  const isFlatbed = equipmentType === 'FLATBED' || equipmentType === 'STEP_DECK';

  const formikProps: FormikFieldProps<Record<string, unknown>> = {
    values: formik.values as unknown as Record<string, unknown>,
    errors: formik.errors as unknown as FormikFieldProps<Record<string, unknown>>['errors'],
    touched: formik.touched as unknown as FormikFieldProps<Record<string, unknown>>['touched'],
    handleChange: formik.handleChange,
    handleBlur: formik.handleBlur,
    setFieldValue: formik.setFieldValue,
  };

  const paymentTermsData = PAYMENT_TERMS_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  const reeferModeData = REEFER_MODE_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  const flatbedLengthData = FLATBED_LENGTH_OPTIONS.map((opt) => ({
    label: opt.label,
    value: String(opt.value),
  }));

  const tarpTypeData = TARP_TYPE_OPTIONS.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }));

  return (
    <SectionCard
      title="Load Details"
      subheader="Set the rate, equipment, and basic load information"
      actions={
        complete ? <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} /> : undefined
      }
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <CustomerAutocomplete
              name="customerId"
              label="Broker / Shipper"
              required
              formik={formikProps}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ContactAutocomplete
              name="contactId"
              label="Broker Contact"
              required
              formik={formikProps}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <TextField name="externalRefNumber" label="External Ref #" formik={formikProps} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <CurrencyField name="customerRate" label="Rate" required formik={formikProps} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <SelectField
              name="paymentTerms"
              label="Payment Terms"
              data={paymentTermsData}
              formik={formikProps}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <SelectField
              name="equipmentType"
              label="Equipment Type"
              required
              data={EQUIPMENT_OPTIONS}
              formik={formikProps}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <NumericField name="loadedMiles" label="Trip Miles" suffix="mi" formik={formikProps} />
          </Box>
        </Box>

        {isReefer && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <NumericField
                name="reeferTempMin"
                label="Temp Min (\u00b0F)"
                suffix="\u00b0F"
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <NumericField
                name="reeferTempMax"
                label="Temp Max (\u00b0F)"
                suffix="\u00b0F"
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SelectField
                name="reeferMode"
                label="Reefer Mode"
                data={reeferModeData}
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <NumericField
                name="reeferPrecool"
                label="Precool (\u00b0F)"
                suffix="\u00b0F"
                formik={formikProps}
              />
            </Box>
          </Box>
        )}

        {isFlatbed && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <SelectField
                name="flatbedLength"
                label="Trailer Length"
                data={flatbedLengthData}
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SelectField
                name="flatbedTarpType"
                label="Tarp Type"
                data={tarpTypeData}
                formik={formikProps}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <NumericField name="flatbedStraps" label="Straps" formik={formikProps} />
            </Box>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
};
