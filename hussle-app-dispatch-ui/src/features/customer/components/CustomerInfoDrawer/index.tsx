import React from 'react';
import { Divider, Grid, MenuItem, Stack, Typography } from '@mui/material';
import { useDispatch } from 'store';
import { TextField, EmailField } from '../../../../mocho/components';
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

const sectionHeaderSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

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
        <Grid container spacing={1.5} sx={{ p: 3 }}>
          {/* <Stack spacing={2.5} sx={{ p: 3 }}> */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={sectionHeaderSx}>
              Company Details
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <TextField name="companyName" label="Company Name" formik={formik} required />
          </Grid>

          <Grid item xs={6}>
            <TextField name="type" label="Type" formik={formik} select required>
              {CUSTOMER_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField name="status" label="Status" formik={formik} select>
              {CUSTOMER_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* <Grid container> */}
          <Grid item xs={6}>
            <TextField name="mcNumber" label="MC #" formik={formik} />
          </Grid>
          <Grid item xs={6}>
            <TextField name="dotNumber" label="DOT #" formik={formik} />
          </Grid>
          {/* </Grid> */}

          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={sectionHeaderSx}>
              Contact Information
            </Typography>
          </Grid>

          {/* <Grid container> */}
          <Grid item xs={6}>
            <TextField name="phone" label="Phone" formik={formik} />
          </Grid>
          <Grid item xs={6}>
            <EmailField name="email" label="Email" formik={formik} />
          </Grid>
          {/* </Grid> */}

          <Grid item xs={12}>
            <TextField name="website" label="Website" formik={formik} />
            <Divider sx={{ my: 0.5 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={sectionHeaderSx}>
              Address
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField name="address" label="Address" formik={formik} />
          </Grid>

          {/* <Grid container> */}
          <Grid item xs={5}>
            <TextField name="city" label="City" formik={formik} />
          </Grid>
          <Grid item xs={3}>
            <TextField name="state" label="State" formik={formik} />
          </Grid>
          <Grid item xs={4}>
            <TextField name="zip" label="ZIP" formik={formik} />
          </Grid>
          {/* </Grid> */}

          <Divider sx={{ my: 0.5 }} />

          <Typography variant="subtitle2" sx={sectionHeaderSx}>
            Payment
          </Typography>

          <Grid container>
            <Grid item xs={6}>
              <TextField name="paymentTerms" label="Payment Terms" formik={formik} select>
                {PAYMENT_TERMS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField name="paymentTermsDays" label="Days" formik={formik} type="number" />
            </Grid>
          </Grid>

          <TextField name="quickPayDiscount" label="Quick Pay Discount (%)" formik={formik} />

          <Divider sx={{ my: 0.5 }} />

          <Typography variant="subtitle2" sx={sectionHeaderSx}>
            Notes
          </Typography>

          <TextField name="notes" label="Notes" formik={formik} multiline minRows={3} />
        </Grid>
      )}
    </FormDrawer>
  );
};
