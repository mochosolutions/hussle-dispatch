import { Box, Grid, Stack, Typography } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { DetailRow, SectionLabel, Body, BodyMuted } from 'components/Typography';
import SectionCardActions from 'components/SectionCardActions';
import { StopCard as StopCardItem } from '../StopCard';
import { AssignmentCard } from '../AssignmentCard';
import { BrokerCard } from '../BrokerCard';
import { FinancialsCard } from '../FinancialsCard';
import { RecentActivityCard } from '../RecentActivityCard';
import { formatTimestamp } from '../../../constants';
import type { LoadDetail } from '../../../types';

interface OverviewTabProps {
  load: LoadDetail;
  onEditRoute: () => void;
  onEditAssignment: () => void;
  onEditContact: () => void;
  onEditRate: () => void;
  onTabChange: (tab: string) => void;
}

export const RouteCard = ({ onEditRoute, stops, status }: any) => {
  console.log('Stops', { stops });
  return (
    <SectionCard
      title="Stops"
      actions={<SectionCardActions onEditRoute={onEditRoute}>Edit</SectionCardActions>}
    >
      <Stack spacing={1}>
        {stops.map((stop) => (
          <StopCardItem key={stop.id} stop={stop} allStops={stops} loadStatus={status} />
        ))}
      </Stack>
    </SectionCard>
  );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  load,
  onEditRoute,
  onEditAssignment,
  onEditContact,
  onEditRate,
  onTabChange,
}) => {
  const sortedStops = [...(load.route.stops ?? [])].sort((a, b) => a.sequence - b.sequence);
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <RouteCard onEditRoute={onEditRoute} status={load.status} stops={sortedStops} />
          <AssignmentCard load={load} onEdit={onEditAssignment} />

          <SectionCard
            title="Notes & Instructions"
            actions={<SectionCardActions onEditRoute={onEditRoute}>Edit</SectionCardActions>}
          >
            {load.dispatcherNotes && (
              <>
                <SectionLabel>Dispatcher Notes</SectionLabel>
                <Body sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>{load.dispatcherNotes}</Body>
              </>
            )}
            {load.driverInstructions && (
              <>
                <SectionLabel>Driver Instructions</SectionLabel>
                <Body sx={{ whiteSpace: 'pre-wrap' }}>{load.driverInstructions}</Body>
              </>
            )}
          </SectionCard>
          {/* )} */}

          <RecentActivityCard
            history={load.activity.statusHistory ?? []}
            onViewTimeline={() => onTabChange('financials')}
          />

          <SectionCard title="Recent Check Calls" sx={{ mt: 2 }}>
            {load.activity.checkCalls.length === 0 ? (
              <BodyMuted>No check-ins yet.</BodyMuted>
            ) : (
              <Stack spacing={1}>
                {load.activity.checkCalls.slice(0, 8).map((call) => {
                  const coordsLabel =
                    call.latitude !== null && call.longitude !== null
                      ? `${call.latitude.toFixed(4)}, ${call.longitude.toFixed(4)}`
                      : null;
                  const headline = call.location ?? coordsLabel ?? 'Driver check-in';
                  const sourceLabel = call.calledByName ?? 'Driver portal';
                  return (
                    <Box
                      key={call.id}
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        pb: 1,
                        '&:last-child': { borderBottom: 0 },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={500}>
                          {headline}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(call.createdAt)}
                        </Typography>
                      </Stack>
                      {call.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {call.notes}
                        </Typography>
                      )}
                      {call.eta && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                          ETA: {formatTimestamp(call.eta)}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                        Logged by: {sourceLabel}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <BrokerCard
              customer={load.customer}
              contact={load.contact}
              externalRefNumber={load.externalRefNumber}
              onEdit={onEditContact}
            />

            <FinancialsCard
              load={load}
              onViewDetails={() => onTabChange('financials')}
              onEditRoute={onEditRate}
            />
            {/* <SectionCard title="Cargo" contentSX={{ p: 0 }}>
              <DetailRow label="Commodity" value={load.cargo.commodity ?? '\u2014'} />
              <DetailRow
                label="Weight"
                value={load.cargo.weight ? `${load.cargo.weight.toLocaleString()} lbs` : '\u2014'}
              />
              <DetailRow label="Pieces" value={load.cargo.pieceCount?.toString() ?? '\u2014'} />
              {load.cargo.isHazmat && <DetailRow label="Hazmat" value="Yes" />}
              {load.cargo.isTarp && <DetailRow label="Tarp Required" value="Yes" />}
              {load.cargo.isTempControlled && (
                <DetailRow label="Temp Controlled" value="Yes" noBorder />
              )}
            </SectionCard> */}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};
