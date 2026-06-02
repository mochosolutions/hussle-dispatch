import { Box, Button, Card, CardContent, Divider, Stack } from '@mui/material';
import { CallOutlined, DirectionsOutlined } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

import { Body, BodyMuted, FieldLabel, Meta, MetaStrong } from 'components/Typography';
import formatPhone from 'utils/formatPhone';
import type { DriverPortalStop } from 'utils/api/driver-portal/driverPortalApi';
import { SCHEDULING_TYPE_LABELS } from '../../loadStatus';

interface StopsCardProps {
  stops: DriverPortalStop[];
}

const formatAppointment = (iso: string): string => format(parseISO(iso), 'MMM d, h:mm a');

const formatAppointmentRange = (start: string | null, end: string | null): string | null => {
  if (start === null) {
    return null;
  }
  if (end === null) {
    return formatAppointment(start);
  }
  return `${formatAppointment(start)} – ${format(parseISO(end), 'h:mm a')}`;
};

const buildDirectionsUrl = (stop: DriverPortalStop): string => {
  const query = [stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const StopItem: React.FC<{ stop: DriverPortalStop; index: number; total: number; isLast: boolean }> = ({
  stop,
  index,
  total,
  isLast,
}) => {
  const isPickup = stop.type === 'PICKUP';
  const apptRange = formatAppointmentRange(stop.appointmentStart, stop.appointmentEnd);
  const cityLine = [stop.city, stop.state, stop.zip].filter(Boolean).join(', ');

  return (
    <Stack direction="row" spacing={1.5} alignItems="stretch">
      {/* Timeline rail */}
      <Stack alignItems="center" sx={{ flexShrink: 0, width: 28 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            bgcolor: isPickup ? 'primary.main' : 'success.main',
            color: 'common.white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {index + 1}
        </Box>
        {!isLast && <Box sx={{ flex: 1, width: 2, bgcolor: 'grey.200', mt: 0.5 }} />}
      </Stack>

      {/* Stop content */}
      <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2.5 }}>
        <Meta
          sx={{
            display: 'inline-block',
            bgcolor: 'grey.100',
            color: 'text.secondary',
            px: 1,
            py: 0.25,
            borderRadius: 999,
            letterSpacing: '0.04em',
            mb: 0.5,
          }}
        >
          {isPickup ? 'PICKUP' : 'DELIVERY'} · {index + 1}/{total}
        </Meta>

        <MetaStrong sx={{ color: 'text.primary', display: 'block' }}>
          {stop.facilityName ?? (isPickup ? 'Pickup' : 'Delivery')}
        </MetaStrong>
        {stop.address && <BodyMuted sx={{ display: 'block' }}>{stop.address}</BodyMuted>}
        {cityLine && <BodyMuted sx={{ display: 'block' }}>{cityLine}</BodyMuted>}

        <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
          {apptRange && (
            <Box>
              <FieldLabel>Appt window</FieldLabel>
              <Body>{apptRange}</Body>
            </Box>
          )}
          <Box>
            <FieldLabel>Scheduling</FieldLabel>
            <Body>{SCHEDULING_TYPE_LABELS[stop.schedulingType] ?? stop.schedulingType}</Body>
          </Box>
        </Stack>

        {stop.contactName && (
          <Box sx={{ mt: 1 }}>
            <FieldLabel>Contact</FieldLabel>
            <Body>
              {stop.contactName}
              {stop.contactPhone ? ` · ${formatPhone(stop.contactPhone)}` : ''}
            </Body>
          </Box>
        )}

        {stop.notes && (
          <Box
            sx={{
              mt: 1.5,
              borderLeft: '3px solid',
              borderColor: 'grey.300',
              bgcolor: 'grey.50',
              px: 1.5,
              py: 1,
              borderRadius: 0.5,
            }}
          >
            <FieldLabel>Stop notes</FieldLabel>
            <Body sx={{ whiteSpace: 'pre-wrap' }}>{stop.notes}</Body>
          </Box>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          {stop.contactPhone && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CallOutlined />}
              href={`tel:${stop.contactPhone}`}
              sx={{ flex: 1 }}
            >
              Call
            </Button>
          )}
          {cityLine && (
            <Button
              variant="contained"
              size="small"
              startIcon={<DirectionsOutlined />}
              href={buildDirectionsUrl(stop)}
              target="_blank"
              rel="noopener"
              sx={{ flex: 1 }}
            >
              Directions
            </Button>
          )}
        </Stack>
      </Box>
    </Stack>
  );
};

// White card holding the ordered stop timeline.
export const StopsCard: React.FC<StopsCardProps> = ({ stops }) => {
  const pickups = stops.filter((stop) => stop.type === 'PICKUP').length;
  const deliveries = stops.length - pickups;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <MetaStrong sx={{ color: 'text.primary' }}>Stops</MetaStrong>
          <Meta>
            {stops.length} stops · {pickups} PU · {deliveries} DEL
          </Meta>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Box>
          {stops.map((stop, index) => (
            <StopItem
              key={stop.id}
              stop={stop}
              index={index}
              total={stops.length}
              isLast={index === stops.length - 1}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StopsCard;
