import { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextField, EmailField, PhoneField } from '@mocho/ui/components';
import type { FormikFieldProps } from '@mocho/ui/forms';
import { FormDrawer } from '../../../../mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { BrokerAutocomplete } from 'features/contact/components/BrokerAutocomplete';
import { useDispatch } from 'store';
import { updateLoadRequest } from '../../store/reducers';
import { createContact } from 'utils/api/fleet/contactApi';
import type { LoadDetail } from '../../types';

// ---------------------------------------------------------------------------
// Inline Contact Form — nested Formik for creating a new contact in-place
// ---------------------------------------------------------------------------

type ContactFormValues = Yup.InferType<typeof contactSchema>;

interface LoadContactDrawerProps {
  load: LoadDetail;
  onClose: () => void;
}

type InlineContactFormValues = Yup.InferType<typeof inlineContactSchema>;

const inlineContactSchema = Yup.object({
  firstName: Yup.string().required('First name is required').trim(),
  lastName: Yup.string().required('Last name is required').trim(),
  email: Yup.string().email('Invalid email'),
  phone: Yup.string(),
}).required();

const contactSchema = Yup.object({
  contactId: Yup.string(),
  externalRefNumber: Yup.string(),
}).required();

interface InlineContactFormProps {
  onCreated: (id: string) => void;
  onCancel: () => void;
  customerId: string | null;
}

const InlineContactForm: React.FC<InlineContactFormProps> = ({
  onCreated,
  onCancel,
  customerId,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialValues: InlineContactFormValues = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };

  const handleSubmit = async (values: InlineContactFormValues) => {
    setSubmitError(null);
    try {
      const contact = await createContact({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || null,
        phone: values.phone || null,
        customerId: customerId ?? null,
      });
      onCreated(contact.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create contact';
      setSubmitError(message);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={inlineContactSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => {
        const fieldProps: FormikFieldProps = {
          values: formik.values,
          errors: formik.errors,
          touched: formik.touched,
          handleChange: formik.handleChange,
          handleBlur: formik.handleBlur,
          setFieldValue: formik.setFieldValue,
        };

        return (
          <Form>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <TextField name="firstName" label="First Name" formik={fieldProps} required />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField name="lastName" label="Last Name" formik={fieldProps} required />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <EmailField name="email" label="Email" formik={fieldProps} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <PhoneField name="phone" label="Phone" formik={fieldProps} />
                </Box>
              </Box>
              {submitError ? (
                <Box sx={{ color: 'error.main', typography: 'caption' }}>{submitError}</Box>
              ) : null}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onCancel}
                  disabled={formik.isSubmitting}
                >
                  Cancel
                </Button>
                <LoadingButton
                  size="small"
                  type="submit"
                  variant="contained"
                  loading={formik.isSubmitting}
                  disabled={!formik.isValid}
                >
                  {formik.isSubmitting ? 'Saving…' : 'Save Contact'}
                </LoadingButton>
              </Stack>
            </Stack>
          </Form>
        );
      }}
    </Formik>
  );
};

export const LoadContactDrawer: React.FC<LoadContactDrawerProps> = ({ load, onClose }) => {
  const dispatch = useDispatch();

  const initialValues: ContactFormValues = {
    contactId: load.contact?.id ?? undefined,
    externalRefNumber: load.externalRefNumber ?? undefined,
  };

  const handleSubmit = (values: ContactFormValues) => {
    dispatch(
      updateLoadRequest({
        id: load.id,
        data: {
          contactId: values.contactId || null,
          externalRefNumber: values.externalRefNumber || null,
        },
      }),
    );
  };

  const scopeParams = load.customer?.id ? { customerId: load.customer.id } : undefined;

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Contact"
      subtitle={load.loadNumber}
      initialValues={initialValues}
      validationSchema={contactSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <DrawerSection label="Contact">
            <BrokerAutocomplete
              formik={formik}
              scopeParams={scopeParams}
              renderInlineCreate={({ onCreated, onCancel }) => (
                <InlineContactForm
                  onCreated={onCreated}
                  onCancel={onCancel}
                  customerId={load.customer?.id ?? null}
                />
              )}
            />
          </DrawerSection>

          <DrawerSection label="Reference">
            <TextField name="externalRefNumber" label="Reference Number" formik={formik} />
          </DrawerSection>
        </Stack>
      )}
    </FormDrawer>
  );
};
