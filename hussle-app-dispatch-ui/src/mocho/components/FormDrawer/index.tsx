import React, { useId } from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import type { FormikProps, FormikValues } from 'formik';
import { Box } from '@mui/material';
import type { ObjectSchema } from 'yup';
import { EditDrawer } from '../../../components/EditDrawer';
import { CancelButton } from '../form-fields/CancelButton';
import { SubmitButton } from '../form-fields/SubmitButton';

interface FormDrawerProps<TValues extends FormikValues> {
  /** Whether the drawer is open */
  open: boolean;

  /** Callback when the drawer should close */
  onClose: () => void;

  /** Drawer header title */
  title: string;

  /** Optional subtitle displayed below the title */
  subtitle?: string;

  /** Initial form values */
  initialValues: TValues;

  /** Yup validation schema */
  validationSchema: ObjectSchema<TValues>;

  /** Form submission handler */
  onSubmit: (values: TValues) => Promise<void> | void;

  /** Render prop for form field content */
  children: (formikProps: FormikProps<TValues>) => React.ReactNode;

  /** Whether Formik should reinitialize when initialValues change */
  enableReinitialize?: boolean;

  /** Custom label for the save button (default: "Save Changes") */
  saveLabel?: string;

  /** Custom label for the saving state (default: "Saving...") */
  savingLabel?: string;

  /** Whether Formik should validate on every change event (default: Formik default — true) */
  validateOnChange?: boolean;

  /** Whether Formik should validate on blur events (default: Formik default — true) */
  validateOnBlur?: boolean;
}

interface FormDrawerContentProps<TValues extends FormikValues> {
  title: string;
  subtitle?: string;
  onClose: () => void;
  formId: string;
  children: (formikProps: FormikProps<TValues>) => React.ReactNode;
  saveLabel: string;
  savingLabel: string;
}

const FormDrawerContent = <TValues extends FormikValues>({
  title,
  subtitle,
  onClose,
  formId,
  children,
  saveLabel,
  savingLabel,
}: FormDrawerContentProps<TValues>): React.ReactElement => {
  const formikProps = useFormikContext<TValues>();
  const { isSubmitting, isValid, dirty } = formikProps;

  const footer = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <CancelButton onClick={onClose} disabled={isSubmitting} size="medium" />
      <SubmitButton
        label={isSubmitting ? savingLabel : saveLabel}
        loading={isSubmitting}
        disabled={!isValid || !dirty}
        fullWidth={false}
        size="medium"
        type="submit"
        form={formId}
      />
    </Box>
  );

  return (
    <EditDrawer
      open
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      isDirty={dirty}
      footer={footer}
    >
      <Form id={formId}>{children(formikProps)}</Form>
    </EditDrawer>
  );
};

/**
 * A reusable drawer wrapper that combines Formik, EditDrawer, and a standard
 * Cancel/Save footer. Handles dirty form confirmation via EditDrawer.
 *
 * @example
 * ```tsx
 * <FormDrawer
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Edit Company Info"
 *   subtitle={carrier.name}
 *   initialValues={{ name: carrier.name, phone: carrier.phone ?? '' }}
 *   validationSchema={companyInfoSchema}
 *   onSubmit={(values) => {
 *     dispatch(updateCarrierRequest({ id: carrierId, data: values }));
 *   }}
 * >
 *   {(formik) => (
 *     <Stack spacing={2.5} sx={{ p: 3 }}>
 *       <TextField name="name" label="Name" formik={formik} />
 *       <TextField name="phone" label="Phone" formik={formik} />
 *     </Stack>
 *   )}
 * </FormDrawer>
 * ```
 */
export const FormDrawer = <TValues extends FormikValues>({
  open,
  onClose,
  title,
  subtitle,
  initialValues,
  validationSchema,
  onSubmit,
  children,
  enableReinitialize = true,
  saveLabel = 'Save Changes',
  savingLabel = 'Saving\u2026',
  validateOnChange,
  validateOnBlur,
}: FormDrawerProps<TValues>): React.ReactElement | null => {
  const formId = useId();

  if (!open) {
    return null;
  }

  return (
    <Formik<TValues>
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        await onSubmit(values);
        setSubmitting(false);
        onClose();
      }}
      enableReinitialize={enableReinitialize}
      validateOnChange={validateOnChange}
      validateOnBlur={validateOnBlur}
    >
      <FormDrawerContent<TValues>
        title={title}
        subtitle={subtitle}
        onClose={onClose}
        formId={formId}
        saveLabel={saveLabel}
        savingLabel={savingLabel}
      >
        {children}
      </FormDrawerContent>
    </Formik>
  );
};

export default FormDrawer;
