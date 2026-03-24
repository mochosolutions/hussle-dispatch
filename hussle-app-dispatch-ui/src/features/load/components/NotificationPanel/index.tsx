import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Switch,
  Typography,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import { format, parseISO } from 'date-fns';
import {
  getLoadNotificationOverrides,
  getLoadNotificationHistory,
  upsertLoadNotificationOverride,
} from 'utils/api/notifications/notificationApi';
import type {
  NotificationOverride,
  NotificationLogEntry,
} from 'utils/api/notifications/notificationApi';

interface NotificationPanelProps {
  loadId: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'Status Change',
  CHECK_CALL: 'Check Call',
  DOCUMENT_UPLOADED: 'Document Upload',
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  EMAIL: <EmailIcon fontSize="small" />,
  SMS: <SmsIcon fontSize="small" />,
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ loadId }) => {
  const [overrides, setOverrides] = useState<NotificationOverride[]>([]);
  const [history, setHistory] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [overridesData, historyData] = await Promise.all([
        getLoadNotificationOverrides(loadId).catch(() => []),
        getLoadNotificationHistory(loadId).catch(() => []),
      ]);
      setOverrides(overridesData);
      setHistory(historyData);
      setLoading(false);
    };

    fetchData();
  }, [loadId]);

  const handleToggleOverride = useCallback(
    async (trigger: string, channel: string, currentEnabled: boolean) => {
      const updated = await upsertLoadNotificationOverride(loadId, {
        trigger,
        channel,
        enabled: !currentEnabled,
      });
      setOverrides((prev) => {
        const existing = prev.findIndex((o) => o.trigger === trigger && o.channel === channel);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = updated;
          return next;
        }
        return [...prev, updated];
      });
    },
    [loadId],
  );

  const getOverrideEnabled = (trigger: string, channel: string): boolean => {
    const override = overrides.find((o) => o.trigger === trigger && o.channel === channel);
    return override?.enabled ?? true;
  };

  if (loading) {
    return <Skeleton variant="rectangular" height={300} />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card variant="outlined">
        <CardHeader
          title="Notification Overrides"
          subheader="Override customer notification settings for this load"
          titleTypographyProps={{ variant: 'subtitle1' }}
          subheaderTypographyProps={{ variant: 'body2' }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {['STATUS_CHANGE', 'CHECK_CALL'].map((trigger) => (
              <Box
                key={trigger}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 500 }}>
                  {TRIGGER_LABELS[trigger]}
                </Typography>
                {['EMAIL', 'SMS'].map((channel) => (
                  <FormControlLabel
                    key={channel}
                    control={
                      <Switch
                        size="small"
                        checked={getOverrideEnabled(trigger, channel)}
                        onChange={() =>
                          handleToggleOverride(
                            trigger,
                            channel,
                            getOverrideEnabled(trigger, channel),
                          )
                        }
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {CHANNEL_ICON[channel]}
                        <Typography variant="caption">{channel}</Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card variant="outlined">
        <CardHeader title="Notification History" titleTypographyProps={{ variant: 'subtitle1' }} />
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
                          {entry.recipientEmail ?? entry.recipientPhone ?? 'Unknown recipient'}{' '}
                          &middot; {format(parseISO(entry.createdAt), 'MMM d, yyyy h:mm a')}
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
  );
};
