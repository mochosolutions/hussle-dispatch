import SectionCard from 'components/SectionCard';
import { Body, BodyMuted } from 'components/Typography';

interface NotesTabProps {
  notes: string | null;
}

export const NotesTab: React.FC<NotesTabProps> = ({ notes }) => (
  <SectionCard title="Notes">
    {notes ? (
      <Body sx={{ whiteSpace: 'pre-wrap', p: 1 }}>{notes}</Body>
    ) : (
      <BodyMuted sx={{ p: 1 }}>No notes added.</BodyMuted>
    )}
  </SectionCard>
);

export default NotesTab;
