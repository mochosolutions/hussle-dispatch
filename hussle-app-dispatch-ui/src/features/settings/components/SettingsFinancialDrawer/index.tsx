import React from 'react';
import { Stack } from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { TextField } from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { settingsSchema } from '../../validators/settingsSchema';
import { selectSettings } from '../../store/selectors/settingsSelectors';
import { updateSettingsRequest } from '../../store/reducers/settingsSlice';
import { buildSettingsFormValues, toUpdateSettingsPayload } from '../../utils/settingsFormValues';

interface SettingsFinancialDrawerProps {
  onClose: () => void;
}

export const SettingsFinancialDrawer: React.FC<SettingsFinancialDrawerProps> = ({ onClose }) => {
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
      title="Edit Financial Settings"
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
            <TextField
              name="defaultTonuFee"
              label="Default TONU Fee ($)"
              type="number"
              required
              formik={formikProps}
            />
            <TextField
              name="defaultDetentionRate"
              label="Default Detention Rate ($/hr)"
              type="number"
              required
              formik={formikProps}
            />
            <TextField
              name="detentionFreeHours"
              label="Detention Free Hours"
              type="number"
              required
              formik={formikProps}
            />
            <TextField
              name="minBookRateProfitMargin"
              label="Min Book Rate Profit Margin (%)"
              type="number"
              required
              formik={formikProps}
            />
            <TextField
              name="weeklyGrossTarget"
              label="Weekly Gross Target ($)"
              type="number"
              required
              formik={formikProps}
            />
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
