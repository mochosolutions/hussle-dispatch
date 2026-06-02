import { Box, Card, CardContent } from '@mui/material';
import { CheckCircleOutline, CancelOutlined } from '@mui/icons-material';

import { Body, BodyMuted, EntityId, SectionTitle } from 'components/Typography';
import type { DriverPortalLoad } from 'utils/api/driver-portal/driverPortalApi';

interface CompletedStateProps {
  load: DriverPortalLoad;
  closed?: boolean;
}

const buildRoute = (load: DriverPortalLoad): string | null => {
  const { stops } = load;
  if (stops.length === 0) {
    return null;
  }
  const place = (stop: { city: string | null; state: string | null }): string =>
    [stop.city, stop.state].filter(Boolean).join(', ');
  const origin = place(stops[0]);
  const destination = place(stops[stops.length - 1]);
  return origin && destination ? `${origin} → ${destination}` : origin || destination;
};

// Read-only end state. Once a load is invoiced (or canceled) the driver has no
// remaining actions — just a confirmation that everything is wrapped up.
export const CompletedState: React.FC<CompletedStateProps> = ({ load, closed = false }) => {
  const route = buildRoute(load);

  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 5, px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {closed ? (
            <CancelOutlined sx={{ fontSize: 72, color: 'text.disabled' }} />
          ) : (
            <CheckCircleOutline sx={{ fontSize: 72, color: 'success.main' }} />
          )}
        </Box>
        <SectionTitle sx={{ fontSize: '1.5rem', mb: 0.5 }}>
          {closed ? 'Load closed' : 'All done'}
        </SectionTitle>
        <EntityId sx={{ display: 'block', mb: 1 }}>{load.loadNumber}</EntityId>
        {route && <Body sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>{route}</Body>}
        <BodyMuted>
          {closed
            ? 'This load was canceled. No further action is needed.'
            : 'This load has been delivered and invoiced. Thanks for the great work!'}
        </BodyMuted>
      </CardContent>
    </Card>
  );
};

export default CompletedState;
