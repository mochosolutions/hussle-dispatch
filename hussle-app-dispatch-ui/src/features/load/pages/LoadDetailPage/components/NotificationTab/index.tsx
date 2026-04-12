import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format, parseISO } from 'date-fns';
import {
  getLoadNotificationOverrides,
  getLoadNotificationHistory,
  getCustomerNotificationSettings,
} from 'utils/api/notifications/notificationApi';
import type {
  NotificationOverride,
  NotificationSetting,
  NotificationLogEntry,
} from 'utils/api/notifications/notificationApi';
import { NotificationOverrideDrawer } from './NotificationOverrideDrawer';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface NotificationPanelProps {
  loadId: string;
  customerId: string | null;
}

const TRIGGERS = ['STATUS_CHANGE', 'CHECK_CALL', 'DOCUMENT_UPLOADED'];

const TRIGGER_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'Status Change',
  CHECK_CALL: 'Check Call',
  DOCUMENT_UPLOADED: 'Document Upload',
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  EMAIL: <EmailIcon fontSize="small" />,
  SMS: <SmsIcon fontSize="small" />,
};

// ---------------------------------------------------------------------------
// Channel chip — shows enabled/disabled + source (override vs default)
// ---------------------------------------------------------------------------

interface ChannelChipProps {
  channel: string;
  enabled: boolean;
  isOverride: boolean;
  recipient: string | null;
}

const ChannelChip: React.FC<ChannelChipProps> = ({ channel, enabled, isOverride, recipient }) => {
  const label = isOverride ? channel : `${channel} (default)`;
  const tooltipText = recipient
    ? `${channel === 'EMAIL' ? 'To' : 'Phone'}: ${recipient}`
    : 'Uses load contact';

  return (
    <Tooltip title={tooltipText} arrow placement="top">
      <Chip
        icon={
          enabled ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <CancelIcon sx={{ fontSize: 16 }} />
        }
        label={label}
        size="small"
        variant={isOverride ? 'filled' : 'outlined'}
        color={enabled ? 'success' : 'default'}
        sx={{ opacity: enabled ? 1 : 0.5 }}
      />
    </Tooltip>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NotificationTab: React.FC<NotificationPanelProps> = ({ loadId, customerId }) => {
  const [overrides, setOverrides] = useState<NotificationOverride[]>([]);
  const [customerSettings, setCustomerSettings] = useState<NotificationSetting[]>([]);
  const [history, setHistory] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshData = useCallback(() => {
    setLoading(true);
    const promises: [
      Promise<NotificationOverride[]>,
      Promise<NotificationLogEntry[]>,
      Promise<NotificationSetting[]>,
    ] = [
      getLoadNotificationOverrides(loadId).catch((): NotificationOverride[] => []),
      getLoadNotificationHistory(loadId).catch((): NotificationLogEntry[] => []),
      customerId
        ? getCustomerNotificationSettings(customerId).catch((): NotificationSetting[] => [])
        : Promise.resolve([]),
    ];

    Promise.all(promises).then(([overridesData, historyData, settingsData]) => {
      setOverrides(overridesData);
      setHistory(historyData);
      setCustomerSettings(settingsData);
      setLoading(false);
    });
  }, [loadId, customerId]);

  useEffect(() => {
    let cancelled = false;

    const promises: [
      Promise<NotificationOverride[]>,
      Promise<NotificationLogEntry[]>,
      Promise<NotificationSetting[]>,
    ] = [
      getLoadNotificationOverrides(loadId).catch((): NotificationOverride[] => []),
      getLoadNotificationHistory(loadId).catch((): NotificationLogEntry[] => []),
      customerId
        ? getCustomerNotificationSettings(customerId).catch((): NotificationSetting[] => [])
        : Promise.resolve([]),
    ];

    Promise.all(promises).then(([overridesData, historyData, settingsData]) => {
      if (!cancelled) {
        setOverrides(overridesData);
        setHistory(historyData);
        setCustomerSettings(settingsData);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadId, customerId]);

  // Resolve enabled state: override > customer default > true
  const getChannelState = (trigger: string, channel: string) => {
    const override = overrides.find((o) => o.trigger === trigger && o.channel === channel);
    const setting = customerSettings.find((s) => s.trigger === trigger && s.channel === channel);

    const enabled = override?.enabled ?? setting?.enabled ?? true;
    const isOverride = Boolean(override);
    const recipient =
      channel === 'EMAIL'
        ? (override?.recipientEmail ?? setting?.recipientEmail ?? null)
        : (override?.recipientPhone ?? setting?.recipientPhone ?? null);

    return { enabled, isOverride, recipient };
  };

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    refreshData();
  }, [refreshData]);

  if (loading) {
    return <Skeleton variant="rectangular" height={300} />;
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Overrides — read-only */}
        <Card variant="outlined">
          <CardHeader
            title="Notification Settings"
            subheader="Customer defaults with per-load overrides"
            titleTypographyProps={{ variant: 'subtitle1' }}
            subheaderTypographyProps={{ variant: 'body2' }}
            action={
              <Button size="small" startIcon={<EditIcon />} onClick={handleOpenDrawer}>
                Edit
              </Button>
            }
          />
          <CardContent>
            <Stack spacing={1.5}>
              {TRIGGERS.map((trigger) => {
                const emailState = getChannelState(trigger, 'EMAIL');
                const smsState = getChannelState(trigger, 'SMS');

                return (
                  <Stack key={trigger} direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" sx={{ minWidth: 130, fontWeight: 500 }}>
                      {TRIGGER_LABELS[trigger]}
                    </Typography>
                    <ChannelChip
                      channel="EMAIL"
                      enabled={emailState.enabled}
                      isOverride={emailState.isOverride}
                      recipient={emailState.recipient}
                    />
                    <ChannelChip
                      channel="SMS"
                      enabled={smsState.enabled}
                      isOverride={smsState.isOverride}
                      recipient={smsState.recipient}
                    />
                  </Stack>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Notification History */}
        <Card variant="outlined">
          <CardHeader
            title="Notification History"
            titleTypographyProps={{ variant: 'subtitle1' }}
          />
          <CardContent sx={{ p: 0 }}>
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No notifications have been sent for this load yet.
              </Typography>
            ) : (
              <List disablePadding>
                {history.map((entry, idx) => (
                  <Box key={entry.id}>
                    {idx > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {CHANNEL_ICON[entry.channel]}
                            <Typography variant="body2" fontWeight={500}>
                              {entry.subject ?? TRIGGER_LABELS[entry.trigger]}
                            </Typography>
                            <Chip
                              label={entry.status}
                              size="small"
                              color={entry.status === 'sent' ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {entry.recipientEmail ?? entry.recipientPhone ?? 'Unknown recipient'}
                            {' \u00B7 '}
                            {format(parseISO(entry.createdAt), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Edit drawer */}
      {drawerOpen && (
        <NotificationOverrideDrawer
          loadId={loadId}
          overrides={overrides}
          customerSettings={customerSettings}
          onClose={handleCloseDrawer}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default NotificationTab;
