import { useRef } from 'react';
import { Grid, InputAdornment, OutlinedInput, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { FormikProps } from 'formik';
import { TextField, SelectField, BaseFieldWrapper } from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';
import BrokerAutocomplete from 'features/contact/components/BrokerAutocomplete';
import CustomerAutocomplete from 'features/customer/components/CustomerAutocomplete';
import SectionCard from 'components/SectionCard';
import type { LoadFormValues } from '../../../../validators/loadSchema';
import {
  EQUIPMENT_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  REEFER_MODE_OPTIONS,
  FLATBED_LENGTH_OPTIONS,
  TARP_TYPE_OPTIONS,
} from '../../../../constants';

interface LoadDetailsSectionProps {
  formik: FormikProps<LoadFormValues>;
  complete?: boolean;
}

export const LoadDetailsSection: React.FC<LoadDetailsSectionProps> = ({ formik, complete }) => {
  // const rateConRef = useRef<HTMLInputElement>(null);
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
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={4}>
          <CustomerAutocomplete
            name="customerId"
            required={true}
            value={formik.values.customerId ?? ''}
            onChange={(customerId) => {
              void formik.setFieldValue('customerId', customerId || undefined);
            }}
            onBlur={() => {
              void formik.setFieldTouched('customerId', true);
            }}
            label="Customer"
            error={Boolean(formik.touched.customerId && formik.errors.customerId)}
            helperText={
              formik.touched.customerId
                ? (formik.errors.customerId as string | undefined)
                : undefined
            }
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <BrokerAutocomplete
            name="contactId"
            value={formik.values.contactId ?? ''}
            onChange={(contactId) => {
              void formik.setFieldValue('contactId', contactId || undefined);
            }}
            onBlur={() => {
              void formik.setFieldTouched('contactId', true);
            }}
            label="Contact *"
            error={Boolean(formik.touched.contactId && formik.errors.contactId)}
            helperText={
              formik.touched.contactId ? (formik.errors.contactId as string | undefined) : undefined
            }
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField name="externalRefNumber" label="External Ref #" formik={formikProps} />
        </Grid>

        {/* Row 2: Rate + Equipment + Payment Terms + Total Miles */}
        <Grid item xs={12} md={3}>
          <BaseFieldWrapper
            name="customerRate"
            label="Rate"
            required
            error={formikProps.errors.customerRate as string | undefined}
            touched={formikProps.touched.customerRate as boolean | undefined}
            helperText="Total flat rate for this load"
          >
            <OutlinedInput
              id="customerRate"
              name="customerRate"
              type="number"
              value={formikProps.values.customerRate ?? ''}
              onChange={formikProps.handleChange}
              onBlur={formikProps.handleBlur}
              fullWidth
              error={Boolean(formikProps.touched.customerRate && formikProps.errors.customerRate)}
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
              inputProps={{ min: 0, step: 1 }}
            />
          </BaseFieldWrapper>
        </Grid>
        <Grid item xs={12} md={3}>
          <SelectField
            name="paymentTerms"
            label="Payment Terms"
            data={paymentTermsData}
            formik={formikProps}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <SelectField
            name="equipmentType"
            label="Equipment Type"
            required
            data={EQUIPMENT_OPTIONS}
            formik={formikProps}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField name="totalMiles" label="Total Miles (auto from route)" formik={formikProps} />
        </Grid>

        {/* Row 3: Commodity + Weight */}
        <Grid item xs={12} md={6}>
          <TextField name="commodity" label="Commodity" formik={formikProps} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField name="weight" label="Weight (lbs)" formik={formikProps} />
        </Grid>

        {/* Conditional reefer fields */}
        {isReefer && (
          <>
            <Grid item xs={6} md={3}>
              <TextField name="reeferTempMin" label="Temp Min (\u00b0F)" formik={formikProps} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField name="reeferTempMax" label="Temp Max (\u00b0F)" formik={formikProps} />
            </Grid>
            <Grid item xs={6} md={3}>
              <SelectField
                name="reeferMode"
                label="Reefer Mode"
                data={reeferModeData}
                formik={formikProps}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField name="reeferPrecool" label="Precool (\u00b0F)" formik={formikProps} />
            </Grid>
          </>
        )}

        {/* Conditional flatbed fields */}
        {isFlatbed && (
          <>
            <Grid item xs={6} md={4}>
              <SelectField
                name="flatbedLength"
                label="Trailer Length"
                data={flatbedLengthData}
                formik={formikProps}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <SelectField
                name="flatbedTarpType"
                label="Tarp Type"
                data={tarpTypeData}
                formik={formikProps}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField name="flatbedStraps" label="Straps" formik={formikProps} />
            </Grid>
          </>
        )}
      </Grid>
    </SectionCard>
  );
};
