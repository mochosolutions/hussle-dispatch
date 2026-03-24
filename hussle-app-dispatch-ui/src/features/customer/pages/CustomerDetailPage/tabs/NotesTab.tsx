import { useState } from 'react';
import { Box, Button, Card, Stack, TextField, Typography } from '@mui/material';

interface NotesTabProps {
  customerId: string;
  notes: string | null;
}

export const NotesTab: React.FC<NotesTabProps> = ({ customerId: _customerId, notes }) => {
  const [newNote, setNewNote] = useState('');

  const handleSubmit = () => {
    const trimmed = newNote.trim();
    if (!trimmed) {
      return;
    }
    // TODO: Dispatch create note action when customer notes API is available
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
            placeholder="Write a note about this customer..."
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

      {/* Existing Notes */}
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
          {notes ? (
            <Typography
              variant="body2"
              sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
            >
              {notes}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 3, textAlign: 'center', fontStyle: 'italic' }}
            >
              No notes yet. Add the first note above.
            </Typography>
          )}
        </Box>
      </Card>
    </Stack>
  );
};
