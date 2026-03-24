import { Grid, Stack, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MainCard from 'components/MainCard';
import SectionCard from 'components/SectionCard';
import { SectionHeader } from 'components/SectionHeader';

import { LoadMapPlaceholder } from '../../../components/LoadMapPlaceholder';
import { StopCard } from '../../../components/StopCard';
import { AssignmentCard } from '../../../components/AssignmentCard';
import { BrokerCard } from '../../../components/BrokerCard';
import { FinancialsCard } from '../../../components/FinancialsCard';
import { MileageCargoCard } from '../../../components/MileageCargoCard';
import { PlannedBackhaulPanel } from '../../../components/PlannedBackhaulPanel';
import type { LoadDetail } from '../../../types';
// import Button from '../../../../../mocho/theme/overrides/Button';

interface OverviewTabProps {
  load: LoadDetail;
  onEditRoute: () => void;
  onEditAssignment: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  load,
  onEditRoute,
  onEditAssignment,
}) => {
  const sortedStops = [...(load.stops ?? [])].sort((a, b) => a.sequence - b.sequence);

  const lastDelivery = [...(load.stops ?? [])]
    .filter((s) => s.type === 'DELIVERY')
    .sort((a, b) => b.sequence - a.sequence)[0];

  const plannedBackhaul = (load as Record<string, unknown>).plannedBackhaul as
    | {
        route: string;
        rate: number | null;
        brokerName: string | null;
        pickupDate: string | null;
        isActive: boolean;
      }
    | undefined;

  return (
    <Stack spacing={2}>
      {/* <LoadMapPlaceholder stops={load.stops ?? []} /> */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <SectionCard
            title="Stops"
            actions={
              <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEditRoute}>
                Edit
              </Button>
            }
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

          <Stack sx={{ mt: 2 }}>
            <AssignmentCard load={load} onEdit={onEditAssignment} />
          </Stack>

          {plannedBackhaul && (
            <Stack sx={{ mt: 2 }}>
              <PlannedBackhaulPanel
                backhaul={plannedBackhaul}
                loadDestinationCity={lastDelivery?.city}
                loadDestinationState={lastDelivery?.state}
              />
            </Stack>
          )}
        </Grid>

        {/* Right — Load Details */}
        <Grid item xs={12} md={5}>
          {/* <SectionHeader title="Load Details" /> */}
          <Stack spacing={2}>
            <BrokerCard contact={load.contact} externalRefNumber={load.externalRefNumber} />
            <FinancialsCard load={load} />
            <MileageCargoCard load={load} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};
