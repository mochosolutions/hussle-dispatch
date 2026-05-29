import React from 'react';
import { Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField } from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { BodyMuted } from 'components/Typography';
import { settingsSchema } from '../../validators/settingsSchema';
import { selectSettings } from '../../store/selectors/settingsSelectors';
import { updateSettingsRequest } from '../../store/reducers/settingsSlice';
import { buildSettingsFormValues, toUpdateSettingsPayload } from '../../utils/settingsFormValues';

interface SettingsHeadquartersDrawerProps {
  onClose: () => void;
}

export const SettingsHeadquartersDrawer: React.FC<SettingsHeadquartersDrawerProps> = ({
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
      title="Edit Headquarters Location"
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
            <BodyMuted>
              Set both latitude and longitude to enable headquarters-based deadhead calculations.
              Leave both empty to disable.
            </BodyMuted>
            <TextField
              name="headquartersLatitude"
              label="Headquarters Latitude"
              type="number"
              placeholder="-90 to 90"
              formik={formikProps}
            />
            <TextField
              name="headquartersLongitude"
              label="Headquarters Longitude"
              type="number"
              placeholder="-180 to 180"
              formik={formikProps}
            />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
