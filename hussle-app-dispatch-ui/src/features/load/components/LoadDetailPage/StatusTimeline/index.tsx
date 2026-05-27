import { Box, Stack } from '@mui/material';

import { Meta, MetaStrong, Timestamp } from 'components/Typography';
import { STATUS_LABELS, formatTimestamp } from '../../../constants';
import type { LoadStatus, StatusHistoryEntry } from '../../../types';

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
          <MetaStrong sx={{ color: 'text.primary' }}>
            {entry.fromStatus
              ? `${STATUS_LABELS[entry.fromStatus as LoadStatus] ?? entry.fromStatus} → ${STATUS_LABELS[entry.toStatus as LoadStatus] ?? entry.toStatus}`
              : STATUS_LABELS[entry.toStatus as LoadStatus] ?? entry.toStatus}
          </MetaStrong>
          <Meta>
            {formatTimestamp(entry.createdAt)}
            {entry.changedByName ? ` by ${entry.changedByName}` : ''}
          </Meta>
          {entry.notes && (
            <Timestamp sx={{ display: 'block' }}>
              {entry.notes}
            </Timestamp>
          )}
        </Box>
      </Box>
    ))}
    {history.length === 0 && (
      <Timestamp>
        No status history yet
      </Timestamp>
    )}
  </Stack>
);
