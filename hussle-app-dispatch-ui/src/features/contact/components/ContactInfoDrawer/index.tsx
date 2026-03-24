import React from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useDispatch } from 'store';
import { TextField, EmailField } from '../../../../mocho/components';
import { EditDrawer } from 'components/EditDrawer';
import { CustomerAutocomplete } from 'features/customer/components/CustomerAutocomplete';
import { contactSchema } from '../../validators/contactSchema';
import type { Contact, CreateContactInput, UpdateContactInput } from '../../types';
import { createContactRequest, updateContactRequest } from '../../store/reducers/contactPageSlice';

interface ContactInfoDrawerProps {
  contact?: Contact;
  onClose: () => void;
}

const sectionHeaderSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  contact,
  onClose,
}) => {
  const dispatch = useDispatch();
  const isEditing = Boolean(contact);

  const initialValues = {
    customerId: contact?.customerId ?? '',
    role: contact?.role ?? '',
    firstName: contact?.firstName ?? '',
    lastName: contact?.lastName ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    notes: contact?.notes ?? '',
  };

  const handleSubmit = (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    if (isEditing && contact) {
      const updateData: UpdateContactInput = {
        firstName: values.firstName,
        lastName: values.lastName,
        customerId: values.customerId || null,
        role: values.role || null,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
      };
      dispatch(updateContactRequest({ id: contact.id, data: updateData }));
    } else {
      const createData: CreateContactInput = {
        firstName: values.firstName,
        lastName: values.lastName,
        customerId: values.customerId || null,
        role: values.role || null,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
      };
      dispatch(createContactRequest({ data: createData }));
    }
    setSubmitting(false);
    onClose();
  };

  const contactName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    : undefined;

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={contactSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      <ContactInfoDrawerContent
        isEditing={isEditing}
        contactName={contactName}
        onClose={onClose}
      />
    </Formik>
  );
};

interface ContactInfoDrawerContentProps {
  isEditing: boolean;
  contactName?: string;
  onClose: () => void;
}

const ContactInfoDrawerContent: React.FC<ContactInfoDrawerContentProps> = ({
  isEditing,
  contactName,
  onClose,
}) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    isSubmitting,
    isValid,
    dirty,
  } = useFormikContext<Record<string, unknown>>();

  const formikProps = { values, errors, touched, handleChange, handleBlur, setFieldValue };

  let submitLabel = isEditing ? 'Save Changes' : 'Create Contact';
  if (isSubmitting) {
    submitLabel = 'Saving\u2026';
  }

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        type="submit"
        form="contact-info-form"
        variant="contained"
        disabled={!isValid || !dirty || isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {submitLabel}
      </Button>
    </Box>
  );

  return (
    <EditDrawer
      open
      title={isEditing ? 'Edit Contact' : 'Add Contact'}
      onClose={onClose}
      subtitle={contactName}
      isDirty={dirty}
      footer={footer}
    >
      <Form id="contact-info-form">
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={sectionHeaderSx}>
            Contact Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="firstName" label="First Name" formik={formikProps} required />
            </Grid>
            <Grid item xs={6}>
              <TextField name="lastName" label="Last Name" formik={formikProps} required />
            </Grid>
          </Grid>

          <CustomerAutocomplete
            value={values.customerId as string}
            onChange={(customerId) => {
              void setFieldValue('customerId', customerId);
            }}
            onBlur={handleBlur}
            name="customerId"
            label="Customer"
            error={Boolean(touched.customerId && errors.customerId)}
            helperText={touched.customerId ? (errors.customerId as string | undefined) : undefined}
          />

          <TextField name="role" label="Role" formik={formikProps} placeholder="e.g. dispatch, billing, warehouse manager" />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField name="phone" label="Phone" formik={formikProps} />
            </Grid>
            <Grid item xs={6}>
              <EmailField name="email" label="Email" formik={formikProps} />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={sectionHeaderSx}>
            Notes
          </Typography>

          <TextField name="notes" label="Notes" formik={formikProps} multiline minRows={3} />
        </Stack>
      </Form>
    </EditDrawer>
  );
};
