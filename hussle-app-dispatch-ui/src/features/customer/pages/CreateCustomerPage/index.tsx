import { useCallback, forwardRef } from 'react';
import { useNavigate } from 'react-router';
import { useFormik } from 'formik';
import { Box, Button, Card, Divider, Stack, Typography } from '@mui/material';

import { useDispatch } from 'store';
import { PageWrapper } from '@mocho/ui/components';
import { InnerPageHeader } from '../../../../components/InnerPageHeader';
import { TextField } from '../../../../mocho/components/form-fields/TextField';
import { SelectField } from '../../../../mocho/components/form-fields/SelectField';
import { CharCounterField } from '../../../../mocho/components/form-fields/CharCounterField';
import { EmailField } from '../../../../mocho/components/form-fields/EmailField';
import { PhoneField } from '../../../../mocho/components/form-fields/PhoneField';
import { StateField } from '../../../../mocho/components/form-fields/StateField';
import { ZipCodeField } from '../../../../mocho/components/form-fields/ZipCodeField';
import { PercentField } from '../../../../mocho/components/form-fields/PercentField';
import { useFormRef } from '../../../../mocho/hooks/useFormRef';
import { useFormHandle } from '../../../../mocho/hooks/useFormHandle';
import { useDirtyFormBlocker } from '../../../../mocho/forms/hooks/useDirtyFormBlocker';
import { useModalActions } from '../../../ui/hooks/useModalActions';
import { createCustomerRequest } from '../../store/reducers/customerPageSlice';
import { customerSchema } from '../../validators/customerSchema';
import { CUSTOMER_TYPE_OPTIONS, PAYMENT_TERMS_OPTIONS } from '../../constants';
import type { CustomerFormValues } from '../../validators/customerSchema';
import type { CreateCustomerPayload } from '../../types';
import type { FormHandle, FormStateChangeCallback } from '../../../../mocho/types/form';

// ---------------------------------------------------------------------------
// Section card — reusable within this page
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const SectionCard = ({ title, subtitle, children }: SectionCardProps) => (
  <Card sx={{ mb: 2 }}>
    <Box sx={{ px: 3, py: 2 }}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    <Divider />
    <Box sx={{ px: 3, py: 2.5 }}>{children}</Box>
  </Card>
);

// ---------------------------------------------------------------------------
// Customer create form
// ---------------------------------------------------------------------------

const customerInitialValues: CustomerFormValues = {
  companyName: '',
  type: 'BROKER',
  mcNumber: '',
  dotNumber: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  paymentTerms: 'Net 30',
  paymentTermsDays: 30,
  quickPayDiscount: '',
  notes: '',
  status: 'ACTIVE',
};

interface CustomerCreateFormProps {
  onSubmit: (values: CustomerFormValues) => void;
  onStateChange?: FormStateChangeCallback;
}

const CustomerCreateForm = forwardRef<FormHandle, CustomerCreateFormProps>(
  ({ onSubmit, onStateChange }, ref) => {
    const formik = useFormik<CustomerFormValues>({
      initialValues: customerInitialValues,
      validationSchema: customerSchema,
      validateOnBlur: true,
      validateOnChange: true,
      onSubmit: (values) => {
        onSubmit(values);
      },
    });

    useFormHandle({ ref, formik, onStateChange });

    return (
      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ maxWidth: 720, mx: 'auto', px: 4, py: 3 }}>
          <SectionCard title="Company Information" subtitle="Customer details and classification">
            <Stack spacing={2}>
              <TextField
                name="companyName"
                label="Company Name"
                placeholder="Enter company name"
                formik={formik}
                required
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <SelectField
                    name="type"
                    label="Customer Type"
                    data={CUSTOMER_TYPE_OPTIONS}
                    formik={formik}
                    required
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField name="mcNumber" label="MC Number" placeholder="MC-0000000" formik={formik} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField name="dotNumber" label="DOT Number" placeholder="DOT number" formik={formik} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <PhoneField name="phone" label="Phone" formik={formik} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <EmailField name="email" label="Email" formik={formik} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField name="website" label="Website" placeholder="https://example.com" formik={formik} />
                </Box>
              </Box>
            </Stack>
          </SectionCard>

          <SectionCard title="Address" subtitle="Primary business address">
            <Stack spacing={2}>
              <TextField name="address" label="Street Address" placeholder="123 Main St" formik={formik} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 5 }}>
                  <TextField name="city" label="City" placeholder="City" formik={formik} />
                </Box>
                <Box sx={{ flex: 3 }}>
                  <StateField name="state" label="State" formik={formik} />
                </Box>
                <Box sx={{ flex: 4 }}>
                  <ZipCodeField name="zip" label="ZIP Code" formik={formik} />
                </Box>
              </Box>
            </Stack>
          </SectionCard>

          <SectionCard title="Billing" subtitle="Payment terms and quick pay settings">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <SelectField
                  name="paymentTerms"
                  label="Payment Terms"
                  data={PAYMENT_TERMS_OPTIONS}
                  formik={formik}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <PercentField name="quickPayDiscount" label="Quick Pay Discount" formik={formik} />
              </Box>
            </Box>
          </SectionCard>

          <SectionCard title="Notes" subtitle="Optional notes about this customer">
            <CharCounterField
              name="notes"
              label="Notes"
              placeholder="e.g. Preferred lanes, special requirements..."
              maxLength={500}
              rows={3}
              formik={formik}
            />
          </SectionCard>
        </Box>
      </form>
    );
  },
);

CustomerCreateForm.displayName = 'CustomerCreateForm';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const CreateCustomerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formRef, formState, handleFormStateChange, submitForm } = useFormRef();
  const { openModal } = useModalActions();

  useDirtyFormBlocker({
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    onBlock: (blocker) => {
      openModal('dirtyFormConfirm', {
        onConfirm: () => blocker.proceed?.(),
        onCancel: () => blocker.reset?.(),
      });
    },
  });

  const handleSubmit = useCallback(
    (values: CustomerFormValues) => {
      const payload: CreateCustomerPayload = {
        ...values,
        mcNumber: values.mcNumber || null,
        dotNumber: values.dotNumber || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        zip: values.zip || null,
        quickPayDiscount: values.quickPayDiscount || null,
        notes: values.notes || null,
      };
      dispatch(createCustomerRequest({ data: payload, redirectTo: '/customers' }));
    },
    [dispatch],
  );

  return (
    <PageWrapper errorContext="CreateCustomerPage">
      <InnerPageHeader
        onBack={() => navigate('/customers')}
        backLabel="Customers"
        title="Add New Customer"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/customers')}>
              Cancel
            </Button>
            <Button variant="contained" onClick={submitForm} disabled={formState.isSubmitting}>
              {formState.isSubmitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </Stack>
        }
      />
      <CustomerCreateForm
        ref={formRef}
        onSubmit={handleSubmit}
        onStateChange={handleFormStateChange}
      />
    </PageWrapper>
  );
};

export default CreateCustomerPage;
