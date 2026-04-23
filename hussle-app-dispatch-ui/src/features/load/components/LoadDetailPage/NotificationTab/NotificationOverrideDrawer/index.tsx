import { useCallback, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  OutlinedInput,
  Stack,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import * as Yup from 'yup';
import { getIn } from 'formik';
import type { FormikProps } from 'formik';
import { FormDrawer } from 'mocho/components/FormDrawer';
import { DrawerSection } from 'components/EditDrawer';
import { enqueueSnackbar } from 'notistack';
import { bulkUpsertLoadNotificationOverrides } from 'utils/api/notifications/notificationApi';
import type {
  NotificationOverride,
  NotificationSetting,
  UpsertOverrideInput,
} from 'utils/api/notifications/notificationApi';

// ---------------------------------------------------------------------------
// Types — aligned with backend per-trigger-per-channel model
// ---------------------------------------------------------------------------

interface ChannelValues {
  enabled: boolean;
  recipientEmail: string;
  recipientPhone: string;
  ccEmails: string[];
}

interface TriggerValues {
  email: ChannelValues;
  sms: ChannelValues;
}

interface NotificationOverrideFormValues {
  statusChange: TriggerValues;
  checkCall: TriggerValues;
  documentUploaded: TriggerValues;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const channelSchema = Yup.object({
  enabled: Yup.boolean().required(),
  recipientEmail: Yup.string().email('Must be a valid email').default(''),
  recipientPhone: Yup.string().default(''),
  ccEmails: Yup.array()
    .of(Yup.string().trim().email('Each CC email must be valid').required())
    .default([]),
});

const triggerSchema = Yup.object({
  email: channelSchema.required(),
  sms: channelSchema.required(),
});

const overrideFormSchema = Yup.object({
  statusChange: triggerSchema.required(),
  checkCall: triggerSchema.required(),
  documentUploaded: triggerSchema.required(),
}).required();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TRIGGERS = [
  { key: 'statusChange' as const, apiKey: 'STATUS_CHANGE', label: 'Status Change' },
  { key: 'checkCall' as const, apiKey: 'CHECK_CALL', label: 'Check Call' },
  { key: 'documentUploaded' as const, apiKey: 'DOCUMENT_UPLOADED', label: 'Document Upload' },
];

const buildInitialValues = (
  overrides: NotificationOverride[],
  customerSettings: NotificationSetting[],
): NotificationOverrideFormValues => {
  const findOverride = (trigger: string, channel: string) =>
    overrides.find((o) => o.trigger === trigger && o.channel === channel);

  const findSetting = (trigger: string, channel: string) =>
    customerSettings.find((s) => s.trigger === trigger && s.channel === channel);

  const buildChannel = (trigger: string, channel: string): ChannelValues => {
    const override = findOverride(trigger, channel);
    const setting = findSetting(trigger, channel);

    return {
      enabled: override?.enabled ?? setting?.enabled ?? true,
      recipientEmail: override?.recipientEmail ?? setting?.recipientEmail ?? '',
      recipientPhone: override?.recipientPhone ?? setting?.recipientPhone ?? '',
      ccEmails: override?.ccEmails ?? [],
    };
  };

  const buildTrigger = (trigger: string): TriggerValues => ({
    email: buildChannel(trigger, 'EMAIL'),
    sms: buildChannel(trigger, 'SMS'),
  });

  return {
    statusChange: buildTrigger('STATUS_CHANGE'),
    checkCall: buildTrigger('CHECK_CALL'),
    documentUploaded: buildTrigger('DOCUMENT_UPLOADED'),
  };
};

const formValuesToInputs = (values: NotificationOverrideFormValues): UpsertOverrideInput[] => {
  const inputs: UpsertOverrideInput[] = [];

  TRIGGERS.forEach(({ key, apiKey }) => {
    const trigger = values[key];
    inputs.push({
      trigger: apiKey,
      channel: 'EMAIL',
      enabled: trigger.email.enabled,
      recipientEmail: trigger.email.recipientEmail || null,
      ccEmails: trigger.email.ccEmails,
    });
    inputs.push({
      trigger: apiKey,
      channel: 'SMS',
      enabled: trigger.sms.enabled,
      recipientPhone: trigger.sms.recipientPhone || null,
    });
  });

  return inputs;
};

// ---------------------------------------------------------------------------
// Channel block sub-component
// ---------------------------------------------------------------------------

interface ChannelBlockProps {
  triggerKey: string;
  channel: 'email' | 'sms';
  channelLabel: string;
  icon: React.ReactNode;
  recipientField: 'recipientEmail' | 'recipientPhone';
  recipientLabel: string;
  recipientPlaceholder: string;
  formik: FormikProps<NotificationOverrideFormValues>;
}

const sanitizeCcEmails = (values: string[]): string[] =>
  values
    .map((v) => v.trim())
    .filter((v, idx, arr) => v.length > 0 && arr.indexOf(v) === idx);

const ChannelBlock: React.FC<ChannelBlockProps> = ({
  triggerKey,
  channel,
  channelLabel,
  icon,
  recipientField,
  recipientLabel,
  recipientPlaceholder,
  formik,
}) => {
  const enabledPath = `${triggerKey}.${channel}.enabled`;
  const recipientPath = `${triggerKey}.${channel}.${recipientField}`;
  const ccEmailsPath = `${triggerKey}.${channel}.ccEmails`;
  const isEnabled = Boolean(getIn(formik.values, enabledPath));
  const recipientValue = (getIn(formik.values, recipientPath) ?? '') as string;
  const ccEmailsValue = (getIn(formik.values, ccEmailsPath) ?? []) as string[];
  const showCcEmails = channel === 'email';

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="body2" fontWeight={500}>
          {channelLabel}
        </Typography>
      </Stack>
      <FormControlLabel
        control={
          <Checkbox
            checked={isEnabled}
            onChange={(e) => {
              formik.setFieldValue(enabledPath, e.target.checked);
            }}
            name={enabledPath}
            color="primary"
          />
        }
        label="Enabled"
      />
      <Collapse in={isEnabled}>
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            {recipientLabel}
          </Typography>
          <OutlinedInput
            name={recipientPath}
            value={recipientValue}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder={recipientPlaceholder}
            size="small"
            fullWidth
          />
        </Box>
        {showCcEmails && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: 'block' }}
            >
              CC Emails
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={[]}
              value={ccEmailsValue}
              onChange={(_event, next) => {
                formik.setFieldValue(ccEmailsPath, sanitizeCcEmails(next));
              }}
              renderTags={(values, getTagProps) =>
                values.map((option, index) => {
                  const tagProps = getTagProps({ index });
                  return (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...tagProps}
                      key={`${option}-${String(index)}`}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  placeholder="Type an email and press Enter"
                />
              )}
            />
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NotificationOverrideDrawerProps {
  loadId: string;
  overrides: NotificationOverride[];
  customerSettings: NotificationSetting[];
  onClose: () => void;
  onSave?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NotificationOverrideDrawer: React.FC<NotificationOverrideDrawerProps> = ({
  loadId,
  overrides,
  customerSettings,
  onClose,
  onSave,
}) => {
  const initialValues = useMemo(
    () => buildInitialValues(overrides, customerSettings),
    [overrides, customerSettings],
  );

  const handleSubmit = useCallback(
    async (values: NotificationOverrideFormValues) => {
      const inputs = formValuesToInputs(values);
      await bulkUpsertLoadNotificationOverrides(loadId, inputs);
      enqueueSnackbar('Notification settings updated', { variant: 'success' });
      onSave?.();
    },
    [loadId, onSave],
  );

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit Notifications"
      initialValues={initialValues}
      validationSchema={overrideFormSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Stack spacing={3} sx={{ p: 3 }}>
          {TRIGGERS.map(({ key, label }) => (
            <DrawerSection key={key} label={label}>
              <Stack spacing={2}>
                <ChannelBlock
                  triggerKey={key}
                  channel="email"
                  channelLabel="Email"
                  icon={<EmailIcon fontSize="small" color="action" />}
                  recipientField="recipientEmail"
                  recipientLabel="Recipient Email"
                  recipientPlaceholder="Uses load contact email if blank"
                  formik={formik}
                />
                <ChannelBlock
                  triggerKey={key}
                  channel="sms"
                  channelLabel="SMS"
                  icon={<SmsIcon fontSize="small" color="action" />}
                  recipientField="recipientPhone"
                  recipientLabel="Recipient Phone"
                  recipientPlaceholder="Uses load contact phone if blank"
                  formik={formik}
                />
              </Stack>
            </DrawerSection>
          ))}
        </Stack>
      )}
    </FormDrawer>
  );
};
