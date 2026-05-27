import React from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { useDispatch } from 'store';
import { SectionLabel } from 'components/Typography';
import { TextField, EmailField, PhoneField, StateField, ZipCodeField, PercentField, NumericField, SelectField } from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { customerSchema } from '../../validators/customerSchema';
import type {
  Customer,
  CustomerType,
  UpdateCustomerPayload,
  CreateCustomerPayload,
} from '../../types';
import {
  createCustomerRequest,
  updateCustomerRequest,
} from '../../store/reducers/customerPageSlice';
import {
  BILLING_METHOD_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  CUSTOMER_STATUS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
} from '../../constants';

interface CustomerInfoDrawerProps {
  customer?: Customer;
  defaultType?: CustomerType;
  initialCompanyName?: string;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export const CustomerInfoDrawer: React.FC<CustomerInfoDrawerProps> = ({
  customer,
  defaultType,
  initialCompanyName,
  onClose,
  onCreated,
}) => {
  const dispatch = useDispatch();
  const isEditing = Boolean(customer);

  const initialValues = {
    companyName: customer?.companyName ?? initialCompanyName ?? '',
    type: customer?.type ?? defaultType ?? ('' as CustomerType),
    mcNumber: customer?.mcNumber ?? '',
    dotNumber: customer?.dotNumber ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    website: customer?.website ?? '',
    address: customer?.address ?? '',
    city: customer?.city ?? '',
    state: customer?.state ?? '',
    zip: customer?.zip ?? '',
    paymentTerms: customer?.paymentTerms ?? 'Net 30',
    paymentTermsDays: customer?.paymentTermsDays ?? 30,
    quickPayDiscount: customer?.quickPayDiscount ?? '',
    notes: customer?.notes ?? '',
    billingMethod: customer?.billingMethod ?? 'DIRECT',
    status: customer?.status ?? 'ACTIVE',
  };

  const handleSubmit = (values: typeof initialValues) => {
    if (isEditing && customer) {
      const updateData: UpdateCustomerPayload = {
        companyName: values.companyName,
        type: values.type || undefined,
        mcNumber: values.mcNumber || null,
        dotNumber: values.dotNumber || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        zip: values.zip || null,
        paymentTerms: values.paymentTerms,
        paymentTermsDays: values.paymentTermsDays,
        quickPayDiscount: values.quickPayDiscount || null,
        notes: values.notes || null,
        billingMethod: values.billingMethod,
        status: values.status,
      };
      dispatch(updateCustomerRequest({ id: customer.id, data: updateData }));
    } else {
      const createData: CreateCustomerPayload = {
        companyName: values.companyName,
        type: values.type,
        mcNumber: values.mcNumber || null,
        dotNumber: values.dotNumber || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        zip: values.zip || null,
        paymentTerms: values.paymentTerms,
        paymentTermsDays: values.paymentTermsDays,
        quickPayDiscount: values.quickPayDiscount || null,
        notes: values.notes || null,
        billingMethod: values.billingMethod,
        status: values.status,
      };
      dispatch(createCustomerRequest({ data: createData, onCreated }));
    }
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title={isEditing ? 'Edit Customer' : 'Add Customer'}
      subtitle={customer?.companyName}
      initialValues={initialValues}
      validationSchema={customerSchema}
      onSubmit={handleSubmit}
      saveLabel={isEditing ? 'Save Changes' : 'Create Customer'}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <SectionLabel>Company Details</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField name="companyName" label="Company Name" formik={formik} required />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SelectField name="type" label="Type" data={CUSTOMER_TYPE_OPTIONS} formik={formik} required />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <SelectField name="status" label="Status" data={CUSTOMER_STATUS_OPTIONS} formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField name="mcNumber" label="MC #" formik={formik} />
            </Box>
          </Box>
          <TextField name="dotNumber" label="DOT #" formik={formik} />

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Contact Information</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <PhoneField name="phone" label="Phone" formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <EmailField name="email" label="Email" formik={formik} />
            </Box>
          </Box>
          <TextField name="website" label="Website" formik={formik} />

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Address</SectionLabel>
          <TextField name="address" label="Address" formik={formik} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 5 }}>
              <TextField name="city" label="City" formik={formik} />
            </Box>
            <Box sx={{ flex: 3 }}>
              <StateField name="state" label="State" formik={formik} />
            </Box>
            <Box sx={{ flex: 4 }}>
              <ZipCodeField name="zip" label="ZIP" formik={formik} />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Payment</SectionLabel>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <SelectField name="paymentTerms" label="Payment Terms" data={PAYMENT_TERMS_OPTIONS} formik={formik} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <NumericField name="paymentTermsDays" label="Days" formik={formik} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <SelectField
                name="billingMethod"
                label="Billing Method"
                data={BILLING_METHOD_OPTIONS}
                formik={formik}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <PercentField name="quickPayDiscount" label="Quick Pay Discount" formik={formik} />
            </Box>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Notes</SectionLabel>
          <TextField name="notes" label="Notes" formik={formik} multiline minRows={3} />
        </Stack>
      )}
    </FormDrawer>
  );
};
