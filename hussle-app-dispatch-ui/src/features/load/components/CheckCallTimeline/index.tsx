import { Box, Typography, Stack, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { CheckCall } from '../../types';

interface CheckCallTimelineProps {
  checkCalls: CheckCall[];
}

export const CheckCallTimeline: React.FC<CheckCallTimelineProps> = ({ checkCalls }) => {
  if (checkCalls.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No check calls recorded yet
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {checkCalls.map((cc) => (
        <Box key={cc.id} sx={{ pl: 2, borderLeft: 2, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {new Date(cc.createdAt).toLocaleString()}
            </Typography>
            {cc.status && <Chip label={cc.status} size="small" variant="outlined" />}
            {cc.latitude !== null && cc.longitude !== null && (
              <Chip
                icon={<LocationOnIcon />}
                label={`${parseFloat(cc.latitude).toFixed(4)}, ${parseFloat(cc.longitude).toFixed(4)}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Stack>
          {cc.location && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {cc.location}
            </Typography>
          )}
          {cc.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {cc.notes}
            </Typography>
          )}
          {cc.calledByName && (
            <Typography variant="caption" color="text.disabled">
              By: {cc.calledByName}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
};
