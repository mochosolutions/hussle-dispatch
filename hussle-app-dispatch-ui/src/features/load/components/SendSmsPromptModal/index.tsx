import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { DetailRow } from 'components/Typography';
import {
  fetchSmsPromptHistoryRequest,
  sendSmsPromptRequest,
} from 'features/load/store/reducers/loadPageSlice';
import { selectLoadDetailById } from 'features/load/store/selectors/loadSelectors';
import { selectLastSentAtForLoad } from 'features/load/store/selectors/smsPromptSelectors';

interface SendSmsPromptModalProps {
  loadId: string;
  onClose: () => void;
}

// Default cooldown; actual cooldown is enforced server-side via OrgSettings.
const COOLDOWN_MINUTES = 15;

export const SendSmsPromptModal: React.FC<SendSmsPromptModalProps> = ({ loadId, onClose }) => {
  const dispatch = useDispatch();
  const load = useSelector(selectLoadDetailById(loadId));
  const lastSentAt = useSelector(selectLastSentAtForLoad(loadId));

  // Captured once on mount via lazy initializer — avoids calling Date.now during render.
  const [mountTime] = useState<number>(() => Date.now());

  useEffect(() => {
    dispatch(fetchSmsPromptHistoryRequest({ loadId }));
  }, [dispatch, loadId]);

  const driver = load?.assignment?.driver ?? null;
  const driverName = driver ? `${driver.firstName} ${driver.lastName}` : '—';
  const driverPhone = driver?.phone ?? null;

  const cooldownActive =
    lastSentAt !== null &&
    mountTime - new Date(lastSentAt).getTime() < COOLDOWN_MINUTES * 60_000;

  const previewBody = load ? (
    <>
      Load #{load.loadNumber}: please check in.{' '}
      <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
        &lt;driver portal check-in link&gt;
      </Box>
    </>
  ) : null;

  const handleSend = () => {
    dispatch(sendSmsPromptRequest({ loadId }));
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Check-in SMS</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <DetailRow label="Driver" value={driverName} />
          <DetailRow label="Phone" value={driverPhone ?? 'Not on file'} />
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              Message preview
            </Typography>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'grey.50',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              }}
            >
              {previewBody}
            </Box>
          </Box>
          {cooldownActive && (
            <Alert severity="warning">
              An SMS was sent in the last {COOLDOWN_MINUTES} minutes. The server may reject this
              request due to cooldown.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSend} disabled={driverPhone === null}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};
