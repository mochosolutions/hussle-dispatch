import React from 'react';
import { Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField, EmailField } from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { settingsSchema } from '../../validators/settingsSchema';
import { selectSettings } from '../../store/selectors/settingsSelectors';
import { updateSettingsRequest } from '../../store/reducers/settingsSlice';
import { buildSettingsFormValues, toUpdateSettingsPayload } from '../../utils/settingsFormValues';

interface SettingsCommunicationDrawerProps {
  onClose: () => void;
}

export const SettingsCommunicationDrawer: React.FC<SettingsCommunicationDrawerProps> = ({
  onClose,
}) => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);

  if (!settings) {
    return null;
  }

  const initialValues = buildSettingsFormValues(settings);

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Communication"
      subtitle="Organization settings"
      initialValues={initialValues}
      validationSchema={settingsSchema}
      enableReinitialize
      onSubmit={(values) => {
        dispatch(updateSettingsRequest({ values: toUpdateSettingsPayload(values) }));
      }}
    >
      {(formik) => {
        const formikProps: FormikFieldProps = {
          values: formik.values as unknown as Record<string, unknown>,
          errors: formik.errors,
          touched: formik.touched,
          handleChange: formik.handleChange,
          handleBlur: formik.handleBlur,
          setFieldValue: formik.setFieldValue,
        };

        return (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <EmailField
              name="loadIntelEmailAddress"
              label="Load Intel Email Address"
              formik={formikProps}
            />
            <EmailField name="sesFromEmail" label="SES From Email" formik={formikProps} />
            <TextField name="companyLogoUrl" label="Company Logo URL" formik={formikProps} />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
