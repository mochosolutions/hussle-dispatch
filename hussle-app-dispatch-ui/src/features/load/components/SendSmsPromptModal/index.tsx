import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
} from '@mui/material';
import { useDispatch, useSelector } from 'store';
import { DetailRow, Meta } from 'components/Typography';
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

const COOLDOWN_MINUTES = 15;
const MAX_BODY_LENGTH = 640;

const buildDefaultBody = (loadNumber: string): string =>
  `Hussle: Load #${loadNumber} needs a check-in.`;

export const SendSmsPromptModal: React.FC<SendSmsPromptModalProps> = ({ loadId, onClose }) => {
  const dispatch = useDispatch();
  const load = useSelector(selectLoadDetailById(loadId));
  const lastSentAt = useSelector(selectLastSentAtForLoad(loadId));

  const [mountTime] = useState<number>(() => Date.now());

  const defaultBody = useMemo(
    () => (load ? buildDefaultBody(load.loadNumber) : ''),
    [load],
  );

  const [body, setBody] = useState<string>(defaultBody);

  useEffect(() => {
    dispatch(fetchSmsPromptHistoryRequest({ loadId }));
  }, [dispatch, loadId]);

  useEffect(() => {
    setBody(defaultBody);
  }, [defaultBody]);

  const driver = load?.assignment?.driver ?? null;
  const driverName = driver ? `${driver.firstName} ${driver.lastName}` : '—';
  const driverPhone = driver?.phone ?? null;

  const cooldownActive =
    lastSentAt !== null &&
    mountTime - new Date(lastSentAt).getTime() < COOLDOWN_MINUTES * 60_000;

  const trimmed = body.trim();
  const isDirty = trimmed !== defaultBody.trim();
  const overLimit = trimmed.length > MAX_BODY_LENGTH;
  const canSend = driverPhone !== null && trimmed.length > 0 && !overLimit;

  const handleSend = () => {
    dispatch(
      sendSmsPromptRequest({
        loadId,
        body: isDirty ? trimmed : undefined,
      }),
    );
  };

  const handleReset = () => setBody(defaultBody);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Check-in SMS</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <DetailRow label="Driver" value={driverName} />
          <DetailRow label="Phone" value={driverPhone ?? 'Not on file'} />
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Meta>Message body</Meta>
              {isDirty && (
                <Link component="button" type="button" onClick={handleReset} underline="hover">
                  Reset to default
                </Link>
              )}
            </Stack>
            <TextField
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              minRows={4}
              maxRows={8}
              fullWidth
              error={overLimit}
              helperText={
                overLimit
                  ? `Message is ${trimmed.length} characters — limit is ${MAX_BODY_LENGTH}.`
                  : `${trimmed.length} / ${MAX_BODY_LENGTH} characters. The short check-in link is appended automatically if not already present.`
              }
              inputProps={{ 'aria-label': 'SMS message body' }}
            />
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
        <Button variant="contained" onClick={handleSend} disabled={!canSend}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};
