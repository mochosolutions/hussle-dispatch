import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'store';
import {
  selectCarrierNotes,
  selectCarrierNotesLoading,
} from '../../../store/selectors/carrierSelectors';
import {
  fetchCarrierNotesRequest,
  createCarrierNoteRequest,
} from '../../../store/reducers';

interface NotesTabProps {
  carrierId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ carrierId }) => {
  const dispatch = useDispatch();
  const notes = useSelector(selectCarrierNotes(carrierId));
  const isLoading = useSelector(selectCarrierNotesLoading(carrierId));
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    dispatch(fetchCarrierNotesRequest({ carrierId }));
  }, [dispatch, carrierId]);

  const handleSubmit = () => {
    const trimmed = newNote.trim();
    if (!trimmed) {
      return;
    }
    dispatch(createCarrierNoteRequest({ carrierId, data: { content: trimmed } }));
    setNewNote('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* Add Note Form */}
      <Card>
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
          >
            Add Note
          </Typography>
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            placeholder="Write a note about this carrier..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={!newNote.trim()}
            >
              Add Note
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Notes List */}
      <Card>
        <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
          >
            Notes
          </Typography>
        </Box>
        <Box sx={{ px: 3, py: 2 }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!isLoading && notes.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 3, textAlign: 'center', fontStyle: 'italic' }}
            >
              No notes yet. Add the first note above.
            </Typography>
          )}

          {!isLoading && notes.length > 0 && (
            <Stack spacing={0} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
              {notes.map((note) => (
                <Box key={note.id} sx={{ py: 1.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                  >
                    {note.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                    {note.authorName} — {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Card>
    </Stack>
  );
};
