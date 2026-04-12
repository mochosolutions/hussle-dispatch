import { Button } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { StatusTimeline } from '../StatusTimeline';
import type { StatusHistoryEntry } from '../../types';

const MAX_ENTRIES = 4;

interface RecentActivityCardProps {
  history: StatusHistoryEntry[];
  onViewTimeline?: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  history,
  onViewTimeline,
}) => (
  <SectionCard title="Recent Activity">
    <StatusTimeline history={history.slice(0, MAX_ENTRIES)} />
    {onViewTimeline && history.length > MAX_ENTRIES && (
      <Button
        size="small"
        onClick={onViewTimeline}
        sx={{ mt: 1, textTransform: 'none' }}
      >
        View full timeline →
      </Button>
    )}
  </SectionCard>
);
