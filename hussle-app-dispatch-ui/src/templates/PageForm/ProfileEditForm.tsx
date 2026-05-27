import { forwardRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Alert } from '@mui/material';
import { ProfileForm, ProfileFormValues } from './ProfileForm';
import { useFormHandle } from 'hooks/useFormHandle';
import { useUserInteractionDirty } from 'hooks/useUserInteractionDirty';
import type { FormHandle, FormState } from 'types/form';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  bio: Yup.string(),
});

interface ProfileEditFormProps {
  initialValues: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  onStateChange?: (state: FormState) => void;
}

// forwardRef is required — without it the page's submitForm() silently does nothing
const ProfileEditForm = forwardRef<FormHandle, ProfileEditFormProps>((props, ref) => {
  const { initialValues, onSubmit, onStateChange } = props;

  // Prevents false dirty state when initialValues load async
  // Only used in edit forms
  const { wrapHandler, createFormState } = useUserInteractionDirty();

  const formik = useFormik<ProfileFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setStatus }) => {
      try {
        await onSubmit(values);
      } catch (error) {
        setStatus({
          error: error instanceof Error ? error.message : 'Something went wrong.',
        });
      }
    },
  });

  // getDirty uses createFormState to filter out false positives
  useFormHandle({
    ref,
    formik,
    onStateChange,
    getDirty: () => createFormState({
      isSubmitting: formik.isSubmitting,
      isValid: formik.isValid,
      isDirty: formik.dirty,
    }).isDirty,
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} noValidate>
      {formik.status?.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => formik.setStatus(null)}>
          {formik.status.error}
        </Alert>
      )}
      <ProfileForm
        values={formik.values}
        errors={formik.errors}
        touched={formik.touched}
        onChange={wrapHandler(formik.handleChange)}
        onBlur={formik.handleBlur}
      />
    </Box>
  );
});

ProfileEditForm.displayName = 'ProfileEditForm';
export default ProfileEditForm;