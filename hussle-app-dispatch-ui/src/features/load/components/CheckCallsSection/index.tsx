import { useState, useCallback } from 'react';
import { Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material';
import { useDispatch } from 'store';
import { createCheckCallRequest } from '../../store/reducers';
import { formatTimestamp } from '../../constants';
import type { CheckCallSummary } from '../../types';

interface CheckCallsSectionProps {
  checkCalls: CheckCallSummary[];
  loadId: string;
}

export const CheckCallsSection: React.FC<CheckCallsSectionProps> = ({ checkCalls, loadId }) => {
  const dispatch = useDispatch();
  const [newCallNotes, setNewCallNotes] = useState('');
  const [newCallLocation, setNewCallLocation] = useState('');

  const handleAddCheckCall = useCallback(() => {
    if (!newCallNotes.trim() && !newCallLocation.trim()) {
      return;
    }

    dispatch(
      createCheckCallRequest({
        loadId,
        data: {
          location: newCallLocation.trim() || undefined,
          notes: newCallNotes.trim() || undefined,
          brokerNotified: false,
        },
      }),
    );
    setNewCallNotes('');
    setNewCallLocation('');
  }, [dispatch, loadId, newCallNotes, newCallLocation]);

  return (
    <Stack spacing={1.5}>
      {checkCalls.map((call) => (
        <Box
          key={call.id}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(call.createdAt)}
            </Typography>
            {call.status && (
              <Chip label={call.status} size="small" variant="outlined" sx={{ height: 20 }} />
            )}
          </Stack>
          {call.location && (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {call.location}
            </Typography>
          )}
          {call.notes && (
            <Typography variant="caption" color="text.secondary">
              {call.notes}
            </Typography>
          )}
        </Box>
      ))}
      {checkCalls.length === 0 && (
        <Typography variant="caption" color="text.disabled">
          No check calls yet
        </Typography>
      )}

      <Divider />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Add Check Call
      </Typography>
      <TextField
        size="small"
        label="Location"
        value={newCallLocation}
        onChange={(e) => setNewCallLocation(e.target.value)}
        fullWidth
      />
      <TextField
        size="small"
        label="Notes"
        value={newCallNotes}
        onChange={(e) => setNewCallNotes(e.target.value)}
        multiline
        rows={2}
        fullWidth
      />
      <Button
        variant="outlined"
        size="small"
        onClick={handleAddCheckCall}
        disabled={!newCallNotes.trim() && !newCallLocation.trim()}
      >
        Add Check Call
      </Button>
    </Stack>
  );
};
