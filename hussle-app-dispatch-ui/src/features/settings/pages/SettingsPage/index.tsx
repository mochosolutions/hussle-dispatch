import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Stack,
  Switch,
  FormControlLabel,
  Typography,
  Chip,
  IconButton,
  OutlinedInput,
} from '@mui/material';
import { CloseOutlined } from '@ant-design/icons';
import { useFormik } from 'formik';

import { useSelector, useDispatch } from 'store';
import { PageWrapper, PageHeader, MainCard } from '@mocho/ui/components';
import {
  TextField,
  EmailField,
  SubmitButton,
} from 'mocho/components/form-fields';
import type { FormikFieldProps } from 'mocho/components/form-fields';
import { DetailTabBar } from 'components/DetailTabBar';
import { settingsSchema } from '../../validators/settingsSchema';
import TeamTab from '../../components/TeamTab';
import type { SettingsFormValues } from '../../types';
import {
  selectSettings,
  selectSettingsLoading,
  selectSettingsSaving,
  selectSettingsError,
} from '../../store/selectors/settingsSelectors';
import {
  fetchSettingsRequest,
  updateSettingsRequest,
} from '../../store/reducers/settingsSlice';

const sectionHeaderSx = {
  color: 'text.secondary',
  fontWeight: 600,
  textTransform: 'uppercase',
  fontSize: '0.6875rem',
  letterSpacing: 0.5,
} as const;

const buildInitialValues = (settings: ReturnType<typeof selectSettings>): SettingsFormValues => ({
  defaultTonuFee: settings?.defaultTonuFee ?? 250,
  prohibitedCommodities: settings?.prohibitedCommodities ?? [],
  weeklyGrossTarget: settings?.weeklyGrossTarget ?? 5000,
  defaultDetentionRate: settings?.defaultDetentionRate ?? 75,
  detentionFreeHours: settings?.detentionFreeHours ?? 2,
  minBookRateProfitMargin: Math.round((settings?.minBookRateProfitMargin ?? 0.15) * 100),
  defaultMaxDaysOut: settings?.defaultMaxDaysOut ?? 14,
  chainDepthThresholdMiles: settings?.chainDepthThresholdMiles ?? 250,
  backhaulSearchRadiusMiles: settings?.backhaulSearchRadiusMiles ?? 150,
  autoScrapingEnabled: settings?.autoScrapingEnabled ?? true,
  loadIntelEmailAddress: settings?.loadIntelEmailAddress ?? '',
  sesFromEmail: settings?.sesFromEmail ?? '',
  companyLogoUrl: settings?.companyLogoUrl ?? '',
});

const SETTINGS_TABS = [
  { value: 'general', label: 'General' },
  { value: 'team', label: 'Team' },
] as const;

const SettingsPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const settings = useSelector(selectSettings);
  const isLoading = useSelector(selectSettingsLoading);
  const isSaving = useSelector(selectSettingsSaving);
  const error = useSelector(selectSettingsError);

  useEffect(() => {
    dispatch(fetchSettingsRequest());
  }, [dispatch]);

  const initialValues = useMemo(() => buildInitialValues(settings), [settings]);

  const formik = useFormik<SettingsFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema: settingsSchema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        minBookRateProfitMargin: values.minBookRateProfitMargin / 100,
      };
      dispatch(updateSettingsRequest({ values: payload }));
    },
  });

  const formikProps = useMemo<FormikFieldProps>(
    () => ({
      values: formik.values as unknown as Record<string, unknown>,
      errors: formik.errors,
      touched: formik.touched,
      handleChange: formik.handleChange,
      handleBlur: formik.handleBlur,
      setFieldValue: formik.setFieldValue,
    }),
    [
      formik.values,
      formik.errors,
      formik.touched,
      formik.handleChange,
      formik.handleBlur,
      formik.setFieldValue,
    ],
  );

  const handleAddCommodity = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const value = input.value.trim();
      if (value && !formik.values.prohibitedCommodities.includes(value)) {
        formik.setFieldValue('prohibitedCommodities', [
          ...formik.values.prohibitedCommodities,
          value,
        ]);
      }
      input.value = '';
    },
    [formik.values.prohibitedCommodities, formik.setFieldValue],
  );

  const handleRemoveCommodity = useCallback(
    (commodity: string) => {
      formik.setFieldValue(
        'prohibitedCommodities',
        formik.values.prohibitedCommodities.filter((c) => c !== commodity),
      );
    },
    [formik.values.prohibitedCommodities, formik.setFieldValue],
  );

  return (
    <PageWrapper isLoading={isLoading} errorContext="SettingsPage" sx={{ gap: 2 }}>
      <PageHeader title="Settings" subtitle="Manage your organization settings" />

      <DetailTabBar tabs={SETTINGS_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'general' && (
      <>
      {error && (
        <MainCard sx={{ bgcolor: 'error.lighter', borderColor: 'error.light' }}>
          <Typography color="error.main" variant="body2" role="alert">
            {error}
          </Typography>
        </MainCard>
      )}

      <Box component="form" noValidate onSubmit={formik.handleSubmit}>
        <Stack spacing={3} sx={{ maxWidth: 800 }}>
          {/* Financial Settings */}
          <MainCard>
            <Typography variant="subtitle2" sx={{ ...sectionHeaderSx, mb: 2.5 }}>
              Financial Settings
            </Typography>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="defaultTonuFee"
                    label="Default TONU Fee ($)"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="defaultDetentionRate"
                    label="Default Detention Rate ($/hr)"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="detentionFreeHours"
                    label="Detention Free Hours"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="minBookRateProfitMargin"
                    label="Min Book Rate Profit Margin (%)"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="weeklyGrossTarget"
                    label="Weekly Gross Target ($)"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
              </Grid>
            </Stack>
          </MainCard>

          {/* Operations Settings */}
          <MainCard>
            <Typography variant="subtitle2" sx={{ ...sectionHeaderSx, mb: 2.5 }}>
              Operations Settings
            </Typography>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="defaultMaxDaysOut"
                    label="Default Max Days Out"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="chainDepthThresholdMiles"
                    label="Chain Depth Threshold (miles)"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="backhaulSearchRadiusMiles"
                    label="Backhaul Search Radius (miles)"
                    formik={formikProps}
                    type="number"
                    required
                  />
                </Grid>
              </Grid>

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

              {/* Prohibited Commodities */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Prohibited Commodities
                </Typography>
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
          </MainCard>

          {/* Communication Settings */}
          <MainCard>
            <Typography variant="subtitle2" sx={{ ...sectionHeaderSx, mb: 2.5 }}>
              Communication
            </Typography>

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <EmailField
                    name="loadIntelEmailAddress"
                    label="Load Intel Email Address"
                    formik={formikProps}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <EmailField
                    name="sesFromEmail"
                    label="SES From Email"
                    formik={formikProps}
                  />
                </Grid>
              </Grid>

              <TextField
                name="companyLogoUrl"
                label="Company Logo URL"
                formik={formikProps}
              />
            </Stack>
          </MainCard>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SubmitButton
              label="Save Settings"
              loading={isSaving}
              disabled={isSaving || !formik.dirty}
            />
          </Box>
        </Stack>
      </Box>
      </>
      )}

      {activeTab === 'team' && <TeamTab />}
    </PageWrapper>
  );
};

export default SettingsPage;
