import React from 'react';
import { Grid, Stack } from '@mui/material';
import { useDispatch } from 'store';
import { TextField, EmailField } from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { CustomerAutocomplete } from 'features/customer/components/CustomerAutocomplete';
import { contactSchema } from '../../validators/contactSchema';
import type { Contact, CreateContactInput, UpdateContactInput } from '../../types';
import { createContactRequest, updateContactRequest } from '../../store/reducers/contactPageSlice';

interface ContactInfoDrawerProps {
  contact?: Contact;
  onClose: () => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({ contact, onClose }) => {
  const dispatch = useDispatch();
  const isEditing = Boolean(contact);

  const contactName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    : undefined;

  const initialValues = {
    customerId: contact?.customerId ?? '',
    role: contact?.role ?? '',
    firstName: contact?.firstName ?? '',
    lastName: contact?.lastName ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    notes: contact?.notes ?? '',
  };

  const handleSubmit = (values: typeof initialValues) => {
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
  };

  return (
    <FormDrawer
      open={true}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'Add Contact'}
      subtitle={contactName}
      saveLabel={isEditing ? 'Save Changes' : 'Create Contact'}
      initialValues={initialValues}
      validationSchema={contactSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <DrawerSection label="Contact Details">
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="firstName" label="First Name" formik={formik} required />
              </Grid>
              <Grid item xs={6}>
                <TextField name="lastName" label="Last Name" formik={formik} required />
              </Grid>
            </Grid>

            <CustomerAutocomplete name="customerId" formik={formik} />

            <TextField
              name="role"
              label="Role"
              formik={formik}
              placeholder="e.g. dispatch, billing, warehouse manager"
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField name="phone" label="Phone" formik={formik} />
              </Grid>
              <Grid item xs={6}>
                <EmailField name="email" label="Email" formik={formik} />
              </Grid>
            </Grid>
          </DrawerSection>

          <DrawerSection label="Notes">
            <TextField name="notes" label="Notes" formik={formik} multiline minRows={3} />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
