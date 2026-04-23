import React from 'react';
import { Box, Stack } from '@mui/material';
import { useDispatch } from 'store';
import { TextField, EmailField, PhoneField } from '../../../../mocho/components';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { CustomerAutocomplete } from 'features/customer/components/CustomerAutocomplete';
import { contactSchema } from '../../validators/contactSchema';
import { EmailChipsField } from '../EmailChipsField';
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
    ccEmails: contact?.ccEmails ?? [],
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
        ccEmails: values.ccEmails,
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
        ccEmails: values.ccEmails,
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField name="firstName" label="First Name" formik={formik} required />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField name="lastName" label="Last Name" formik={formik} required />
              </Box>
            </Box>

            <CustomerAutocomplete name="customerId" formik={formik} />

            <TextField
              name="role"
              label="Role"
              formik={formik}
              placeholder="e.g. dispatch, billing, warehouse manager"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <PhoneField name="phone" label="Phone" formik={formik} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <EmailField name="email" label="Email" formik={formik} />
              </Box>
            </Box>

            <EmailChipsField
              name="ccEmails"
              label="CC Emails"
              formik={formik}
              placeholder="Type an email and press Enter"
              helperText="Notifications will also be sent to these addresses"
            />
          </DrawerSection>

          <DrawerSection label="Notes">
            <TextField name="notes" label="Notes" formik={formik} multiline minRows={3} />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
