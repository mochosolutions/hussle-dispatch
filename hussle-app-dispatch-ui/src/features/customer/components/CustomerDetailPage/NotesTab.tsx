import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { Meta } from 'components/Typography';

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
      <SectionCard title="Add Note">
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
      </SectionCard>

      {/* Existing Notes */}
      <SectionCard title="Notes">
        {notes ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
          >
            {notes}
          </Typography>
        ) : (
          <Meta sx={{ py: 3, textAlign: 'center', fontStyle: 'italic' }}>
            No notes yet. Add the first note above.
          </Meta>
        )}
      </SectionCard>
    </Stack>
  );
};
