import { Grid, Stack } from '@mui/material';
import SectionCard from 'components/SectionCard';
import SectionCardActions from 'components/SectionCardActions';
import { StopCard } from '../../../components/StopCard';
import { AssignmentCard } from '../../../components/AssignmentCard';
import { BrokerCard } from '../../../components/BrokerCard';
import { FinancialsCard } from '../../../components/FinancialsCard';
import { RecentActivityCard } from '../../../components/RecentActivityCard';
import { LoadDetail } from '../../../types';

interface OverviewTabProps {
  load: LoadDetail;
  onEditRoute: () => void;
  onEditAssignment: () => void;
  onEditContact: () => void;
  onEditRate: () => void;
  onTabChange: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  load,
  onEditRoute,
  onEditAssignment,
  onEditContact,
  onEditRate,
  onTabChange,
}) => {
  const sortedStops = [...(load.stops ?? [])].sort((a, b) => a.sequence - b.sequence);
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <SectionCard
            title="Stops"
            actions={<SectionCardActions onEditRoute={onEditRoute}>Edit</SectionCardActions>}
          >
            <Stack spacing={1}>
              {sortedStops.map((stop) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  allStops={load.stops}
                  loadStatus={load.status}
                />
              ))}
            </Stack>
          </SectionCard>
          <AssignmentCard load={load} onEdit={onEditAssignment} />

          <Stack sx={{ mt: 2 }}>
            <RecentActivityCard
              history={load.statusHistory ?? []}
              onViewTimeline={() => onTabChange('financials')}
            />
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <FinancialsCard
              load={load}
              onViewDetails={() => onTabChange('financials')}
              onEditRoute={onEditRate}
            />
            <BrokerCard
              contact={load.contact}
              externalRefNumber={load.externalRefNumber}
              onEdit={onEditContact}
            />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};
