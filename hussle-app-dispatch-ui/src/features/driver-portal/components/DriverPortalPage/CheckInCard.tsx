import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { ChevronRight, NoteAddOutlined } from '@mui/icons-material';

import { DrawerTitle } from 'components/Typography';
import { checkIn } from 'utils/api/driver-portal/driverPortalApi';
import { captureLocation } from '../../captureLocation';

interface CheckInCardProps {
  loadId: string;
}

interface AxiosLikeError {
  response?: { data?: { errors?: { message: string }[] } };
}

const isAxiosError = (err: unknown): err is AxiosLikeError =>
  typeof err === 'object' && err !== null && 'response' in err;

// "Send ETA / note to dispatch" — a single button that opens a focused dialog,
// keeping the page free of an always-expanded text area.
export const CheckInCard: React.FC<CheckInCardProps> = ({ loadId }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (abortRef.current !== null) {
        abortRef.current.abort();
      }
    },
    [],
  );

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      return;
    }
    if (abortRef.current !== null) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setSubmitting(true);
    setError(null);

    try {
      const coords = await captureLocation();
      if (controller.signal.aborted) {
        return;
      }
      await checkIn(
        loadId,
        { notes: notes.trim(), latitude: coords?.latitude, longitude: coords?.longitude },
        controller.signal,
      );
      if (controller.signal.aborted) {
        return;
      }
      setNotes('');
      setOpen(false);
      setSuccess(true);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        return;
      }
      if (isAxiosError(err) && err.response?.data?.errors?.[0]?.message) {
        setError(err.response.data.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit note');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<NoteAddOutlined />}
        endIcon={<ChevronRight />}
        onClick={() => {
          setSuccess(false);
          setOpen(true);
        }}
        sx={{ py: 1.5, justifyContent: 'space-between' }}
      >
        <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
          Send ETA / note to dispatch
        </Box>
      </Button>

      {success && (
        <Alert severity="success" sx={{ mt: 1 }} onClose={() => setSuccess(false)}>
          Note sent to dispatch
        </Alert>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <DrawerTitle>Send ETA / note to dispatch</DrawerTitle>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            placeholder="Enter notes or ETA update..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            inputProps={{ maxLength: 2000 }}
            helperText={`${notes.length}/2000`}
            sx={{ mt: 1 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !notes.trim()}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckInCard;
