import { Box } from '@mui/material';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { StatusCell } from 'components/Statusbadge';
import {
  Body,
  BodyStrong,
  Amount,
  Timestamp,
  BodyMuted,
} from 'components/Typography';
import { InvoiceReadinessBadge } from './InvoiceReadinessBadge';
import {
  selectLoadCarrierName,
  selectLoadDeliveryDate,
  selectLoadDestinationCity,
  selectLoadDestinationState,
  selectLoadDriverName,
  selectLoadOriginCity,
  selectLoadOriginState,
  selectLoadPickupDate,
} from 'features/load/store/selectors/loadSelectors';
import type { LoadListItem, LoadStatus } from 'features/load/types';

// ---------------------------------------------------------------------------
// Shared cell wrapper
// ---------------------------------------------------------------------------

const CellBox = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>{children}</Box>
);

// ---------------------------------------------------------------------------
// Individual cell renderers
// ---------------------------------------------------------------------------

export const LoadNumberCellRenderer = ({ value }: { value: string }) => (
  <CellBox>
    <BodyStrong sx={{ color: 'primary.main' }}>{value}</BodyStrong>
  </CellBox>
);

export const StopsCellRenderer = ({ data }: { data: LoadListItem }) => {
  const originCity = selectLoadOriginCity(data);
  const originState = selectLoadOriginState(data);
  const destinationCity = selectLoadDestinationCity(data);
  const destinationState = selectLoadDestinationState(data);
  const pickupDate = selectLoadPickupDate(data);
  const deliveryDate = selectLoadDeliveryDate(data);

  const origin = [originCity, originState].filter(Boolean).join(', ');
  const destination = [destinationCity, destinationState].filter(Boolean).join(', ');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        gap: 1,
      }}
    >
      <Box>
        <Body>{origin || '\u2014'}</Body>
        {pickupDate && (
          <Timestamp>{format(parseISO(pickupDate), 'MM/dd/yyyy h:mm a')}</Timestamp>
        )}
      </Box>

      <ArrowRightAltIcon fontSize="small" />

      <Box>
        <Body>{destination || '\u2014'}</Body>
        {deliveryDate && (
          <Timestamp>{format(parseISO(deliveryDate), 'MM/dd/yyyy h:mm a')}</Timestamp>
        )}
      </Box>
    </Box>
  );
};

export const StatusCellRenderer = ({ value }: { value: LoadStatus }) => (
  <StatusCell status={value} />
);

export const RateCellRenderer = ({ value }: { value: string | null }) => {
  if (!value || Number(value) === 0) {
    return (
      <CellBox>
        <BodyMuted>&mdash;</BodyMuted>
      </CellBox>
    );
  }

  return (
    <CellBox>
      <Amount sx={{ color: 'success.main' }}>${Number(value).toLocaleString()}</Amount>
    </CellBox>
  );
};

export const InvoiceCellRenderer = ({ value }: { value: string }) => {
  if (!value || value === 'NOT_READY') {
    return null;
  }

  return (
    <CellBox>
      <InvoiceReadinessBadge readiness={value} />
    </CellBox>
  );
};

const getPickupLabel = (daysUntil: number): { text: string; color: string } => {
  if (daysUntil < 0) {
    return { text: `${Math.abs(daysUntil)}d ago`, color: 'text.disabled' };
  }
  if (daysUntil === 0) {
    return { text: 'Today', color: 'warning.main' };
  }
  if (daysUntil === 1) {
    return { text: 'Tomorrow', color: 'info.main' };
  }
  return { text: `In ${daysUntil}d`, color: 'text.secondary' };
};

export const PickupDateCellRenderer = ({ value }: { value: string | null }) => {
  if (!value) {
    return (
      <CellBox>
        <BodyMuted>&mdash;</BodyMuted>
      </CellBox>
    );
  }

  const date = parseISO(value);
  const daysUntil = differenceInCalendarDays(date, new Date());
  const { text, color } = getPickupLabel(daysUntil);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Body sx={{ fontWeight: 500, lineHeight: 1.3 }}>{format(date, 'MMM d, yyyy')}</Body>
      <Timestamp sx={{ color, lineHeight: 1.2 }}>
        {format(date, 'h:mm a')} &middot; {text}
      </Timestamp>
    </Box>
  );
};

export const AssignmentCellRenderer = ({ data }: { data: LoadListItem }) => {
  const driverName = selectLoadDriverName(data);
  const carrierName = selectLoadCarrierName(data);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Body>{driverName ?? 'Not Assigned'}</Body>
      <Timestamp>{carrierName ?? ''}</Timestamp>
    </Box>
  );
};
