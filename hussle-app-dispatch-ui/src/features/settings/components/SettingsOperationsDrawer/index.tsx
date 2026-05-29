import React from 'react';
import { Box, Chip, FormControlLabel, IconButton, OutlinedInput, Stack, Switch } from '@mui/material';
import { CloseOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'store';
import { TextField } from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { BodyMuted } from 'components/Typography';
import { settingsSchema } from '../../validators/settingsSchema';
import { selectSettings } from '../../store/selectors/settingsSelectors';
import { updateSettingsRequest } from '../../store/reducers/settingsSlice';
import { buildSettingsFormValues, toUpdateSettingsPayload } from '../../utils/settingsFormValues';

interface SettingsOperationsDrawerProps {
  onClose: () => void;
}

export const SettingsOperationsDrawer: React.FC<SettingsOperationsDrawerProps> = ({ onClose }) => {
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
      title="Edit Operations Settings"
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

        const handleAddCommodity = (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key !== 'Enter') {
            return;
          }
          event.preventDefault();
          const input = event.target as HTMLInputElement;
          const value = input.value.trim();
          const current = formik.values.prohibitedCommodities;
          if (value && !current.includes(value)) {
            void formik.setFieldValue('prohibitedCommodities', [...current, value]);
          }
          input.value = '';
        };

        const handleRemoveCommodity = (commodity: string) => {
          void formik.setFieldValue(
            'prohibitedCommodities',
            formik.values.prohibitedCommodities.filter((c) => c !== commodity),
          );
        };

        return (
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <TextField
              name="defaultMaxDaysOut"
              label="Default Max Days Out"
              type="number"
              required
              formik={formikProps}
            />
            <TextField
              name="chainDepthThresholdMiles"
              label="Chain Depth Threshold (miles)"
              type="number"
              required
              formik={formikProps}
            />
            <TextField
              name="backhaulSearchRadiusMiles"
              label="Backhaul Search Radius (miles)"
              type="number"
              required
              formik={formikProps}
            />
            <FormControlLabel
              control={
                <Switch
                  id="autoScrapingEnabled"
                  name="autoScrapingEnabled"
                  checked={formik.values.autoScrapingEnabled}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              }
              label="Auto Scraping Enabled"
            />
            <Box>
              <BodyMuted sx={{ mb: 1, fontWeight: 500 }}>Prohibited Commodities</BodyMuted>
              <OutlinedInput
                placeholder="Type a commodity and press Enter"
                onKeyDown={handleAddCommodity}
                fullWidth
                size="small"
              />
              {formik.values.prohibitedCommodities.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                  {formik.values.prohibitedCommodities.map((commodity) => (
                    <Chip
                      key={commodity}
                      label={commodity}
                      size="small"
                      deleteIcon={
                        <IconButton size="small" aria-label={`Remove ${commodity}`}>
                          <CloseOutlined />
                        </IconButton>
                      }
                      onDelete={() => handleRemoveCommodity(commodity)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        );
      }}
    </FormDrawer>
  );
};
