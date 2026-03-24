import { Box, Stack, Typography } from '@mui/material';
import { STATUS_LABELS, formatTimestamp } from '../../constants';
import type { LoadStatus, StatusHistoryEntry } from '../../types';

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ history }) => (
  <Stack spacing={1}>
    {history.map((entry) => (
      <Box
        key={entry.id}
        sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            mt: 0.75,
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {entry.fromStatus
              ? `${STATUS_LABELS[entry.fromStatus as LoadStatus] ?? entry.fromStatus} → ${STATUS_LABELS[entry.toStatus as LoadStatus] ?? entry.toStatus}`
              : STATUS_LABELS[entry.toStatus as LoadStatus] ?? entry.toStatus}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTimestamp(entry.createdAt)}
            {entry.changedByName ? ` by ${entry.changedByName}` : ''}
          </Typography>
          {entry.notes && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
              {entry.notes}
            </Typography>
          )}
        </Box>
      </Box>
    ))}
    {history.length === 0 && (
      <Typography variant="caption" color="text.disabled">
        No status history yet
      </Typography>
    )}
  </Stack>
);
