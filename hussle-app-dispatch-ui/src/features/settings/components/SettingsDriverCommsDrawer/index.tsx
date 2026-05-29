import React from 'react';
import { Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { DriverCommunicationsSettings } from '../DriverCommunicationsSettings';
import { settingsSchema } from '../../validators/settingsSchema';
import { selectSettings } from '../../store/selectors/settingsSelectors';
import { updateSettingsRequest } from '../../store/reducers/settingsSlice';
import { buildSettingsFormValues, toUpdateSettingsPayload } from '../../utils/settingsFormValues';

interface SettingsDriverCommsDrawerProps {
  onClose: () => void;
}

export const SettingsDriverCommsDrawer: React.FC<SettingsDriverCommsDrawerProps> = ({ onClose }) => {
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
      title="Edit Driver Communications"
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
            <DriverCommunicationsSettings formikProps={formikProps} />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
