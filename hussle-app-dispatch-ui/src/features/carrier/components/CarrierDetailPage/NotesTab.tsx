import { useEffect } from 'react';
import { Box, Button, CircularProgress, Stack } from '@mui/material';
import { PlusOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'store';
import SectionCard from 'components/SectionCard';
import { HintText, Meta, Timestamp } from 'components/Typography';
import { useModalActions } from '../../../ui/hooks/useModalActions';
import {
  selectCarrierNotes,
  selectCarrierNotesLoading,
} from '../../store/selectors/carrierSelectors';
import { fetchCarrierNotesRequest } from '../../store/reducers';

interface NotesTabProps {
  carrierId: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({ carrierId }) => {
  const dispatch = useDispatch();
  const { openModal } = useModalActions();
  const notes = useSelector(selectCarrierNotes(carrierId));
  const isLoading = useSelector(selectCarrierNotesLoading(carrierId));

  useEffect(() => {
    dispatch(fetchCarrierNotesRequest({ carrierId }));
  }, [dispatch, carrierId]);

  const handleAddNote = () => {
    openModal('carrierNote', { carrierId });
  };

  const addNoteButton = (
    <Button
      variant="contained"
      size="small"
      startIcon={<PlusOutlined />}
      onClick={handleAddNote}
    >
      Add Note
    </Button>
  );

  return (
    <SectionCard title="Notes" actions={addNoteButton}>
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!isLoading && notes.length === 0 && (
        <HintText sx={{ py: 3, textAlign: 'center' }}>
          No notes yet. Click &quot;Add Note&quot; to create one.
        </HintText>
      )}

      {!isLoading && notes.length > 0 && (
        <Stack spacing={0} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
          {notes.map((note) => (
            <Box key={note.id} sx={{ py: 1.5 }}>
              <Meta sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {note.content}
              </Meta>
              <Timestamp sx={{ mt: 0.5, display: 'block' }}>
                {note.authorName} — {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
              </Timestamp>
            </Box>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
};
