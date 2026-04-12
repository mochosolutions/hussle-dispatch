import { useEffect, useCallback, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
  Skeleton,
} from '@mui/material';
import { useSelector, useDispatch } from 'store';
import {
  fetchNotificationSettingsRequest,
  updateNotificationSettingsRequest,
} from '../../../store/reducers/customerPageSlice';
import type { NotificationSetting, NotificationTrigger, NotificationChannel } from '../../../types';

interface NotificationsTabProps {
  customerId: string;
}

const TRIGGERS: { key: NotificationTrigger; label: string; description: string }[] = [
  {
    key: 'STATUS_CHANGE',
    label: 'Status Changes',
    description: 'Send notification when load status changes',
  },
  {
    key: 'CHECK_CALL',
    label: 'Check Calls',
    description: 'Send notification when a check call is logged',
  },
  {
    key: 'DOCUMENT_UPLOADED',
    label: 'Document Uploads',
    description: 'Send notification when a document is uploaded',
  },
];

const CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: 'EMAIL', label: 'Email' },
  { key: 'SMS', label: 'SMS' },
];

const findSetting = (
  settings: NotificationSetting[],
  trigger: NotificationTrigger,
  channel: NotificationChannel,
): NotificationSetting | undefined =>
  settings.find((s) => s.trigger === trigger && s.channel === channel);

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ customerId }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.pages.customers.notificationSettings);
  const isLoading = useSelector((state) => state.pages.customers.notificationSettingsLoading);

  useEffect(() => {
    dispatch(fetchNotificationSettingsRequest({ customerId }));
  }, [dispatch, customerId]);

  // Local state for recipient fields (save on blur, not every keystroke)
  const [localRecipients, setLocalRecipients] = useState<Record<string, string>>({});

  const getRecipientKey = (trigger: NotificationTrigger, channel: NotificationChannel) =>
    `${trigger}:${channel}`;

  const getRecipientValue = (
    trigger: NotificationTrigger,
    channel: NotificationChannel,
    field: 'recipientEmail' | 'recipientPhone',
  ): string => {
    const key = getRecipientKey(trigger, channel);
    if (key in localRecipients) {
      return localRecipients[key];
    }
    const setting = findSetting(settings, trigger, channel);
    return (setting?.[field] as string) ?? '';
  };

  const handleToggle = useCallback(
    (trigger: NotificationTrigger, channel: NotificationChannel, currentEnabled: boolean) => {
      const existing = findSetting(settings, trigger, channel);

      dispatch(
        updateNotificationSettingsRequest({
          customerId,
          settings: [
            {
              trigger,
              channel,
              enabled: !currentEnabled,
              recipientEmail: existing?.recipientEmail ?? null,
              recipientPhone: existing?.recipientPhone ?? null,
            },
          ],
        }),
      );
    },
    [dispatch, customerId, settings],
  );

  const handleRecipientChange = useCallback(
    (trigger: NotificationTrigger, channel: NotificationChannel, value: string) => {
      const key = getRecipientKey(trigger, channel);
      setLocalRecipients((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleRecipientBlur = useCallback(
    (trigger: NotificationTrigger, channel: NotificationChannel) => {
      const existing = findSetting(settings, trigger, channel);
      const key = getRecipientKey(trigger, channel);
      const localValue = localRecipients[key];

      if (localValue === undefined) {
        return;
      }

      const currentEmail = existing?.recipientEmail ?? null;
      const currentPhone = existing?.recipientPhone ?? null;
      const newEmail = channel === 'EMAIL' ? (localValue || null) : currentEmail;
      const newPhone = channel === 'SMS' ? (localValue || null) : currentPhone;

      // Only save if value actually changed
      if (newEmail === currentEmail && newPhone === currentPhone) {
        return;
      }

      dispatch(
        updateNotificationSettingsRequest({
          customerId,
          settings: [
            {
              trigger,
              channel,
              enabled: existing?.enabled ?? false,
              recipientEmail: newEmail,
              recipientPhone: newPhone,
            },
          ],
        }),
      );

      // Clear local state after save
      setLocalRecipients((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)),
      );
    },
    [dispatch, customerId, settings, localRecipients],
  );

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Configure automatic notifications sent to this customer when load events occur.
      </Typography>

      {TRIGGERS.map((trigger) => (
        <Card key={trigger.key} variant="outlined">
          <CardHeader
            title={trigger.label}
            subheader={trigger.description}
            titleTypographyProps={{ variant: 'subtitle1' }}
            subheaderTypographyProps={{ variant: 'body2' }}
          />
          <CardContent>
            <Grid container spacing={2}>
              {CHANNELS.map((channel) => {
                const setting = findSetting(settings, trigger.key, channel.key);
                const isEnabled = setting?.enabled ?? false;

                return (
                  <Grid item xs={12} sm={6} key={channel.key}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isEnabled}
                            onChange={() => handleToggle(trigger.key, channel.key, isEnabled)}
                          />
                        }
                        label={channel.label}
                      />
                      {channel.key === 'EMAIL' && isEnabled && (
                        <TextField
                          size="small"
                          fullWidth
                          label="Recipient Email"
                          value={getRecipientValue(trigger.key, channel.key, 'recipientEmail')}
                          onChange={(e) =>
                            handleRecipientChange(trigger.key, channel.key, e.target.value)
                          }
                          onBlur={() => handleRecipientBlur(trigger.key, channel.key)}
                          sx={{ mt: 1 }}
                          placeholder="Uses load contact email if blank"
                        />
                      )}
                      {channel.key === 'SMS' && isEnabled && (
                        <TextField
                          size="small"
                          fullWidth
                          label="Recipient Phone"
                          value={getRecipientValue(trigger.key, channel.key, 'recipientPhone')}
                          onChange={(e) =>
                            handleRecipientChange(trigger.key, channel.key, e.target.value)
                          }
                          onBlur={() => handleRecipientBlur(trigger.key, channel.key)}
                          sx={{ mt: 1 }}
                          placeholder="Uses load contact phone if blank"
                        />
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
