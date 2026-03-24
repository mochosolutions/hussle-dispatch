import { Box, Divider, Stack, Typography } from '@mui/material';
import { StatusBadge } from 'components/Statusbadge';

interface BadgeGroup {
  title: string;
  keys: string[];
}

const BADGE_GROUPS: BadgeGroup[] = [
  {
    title: 'Load Status (14)',
    keys: [
      'QUOTED',
      'BOOKED',
      'DISPATCHED',
      'EN_ROUTE_PICKUP',
      'AT_PICKUP',
      'IN_TRANSIT',
      'AT_DELIVERY',
      'DELIVERED',
      'INVOICE_PENDING',
      'INVOICED',
      'PAID',
      'EXCEPTION',
      'CANCELED',
      'TONU',
    ],
  },
  {
    title: 'Invoice Status (7)',
    keys: ['DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'],
  },
  {
    title: 'Invoice Readiness (4)',
    keys: ['NOT_READY', 'AWAITING_DOCUMENTS', 'READY', 'INVOICE_CREATED'],
  },
  {
    title: 'Carrier Status (4)',
    keys: ['CARRIER_ACTIVE', 'CARRIER_PENDING', 'CARRIER_SUSPENDED', 'CARRIER_DRAFT'],
  },
  {
    title: 'Driver Status (6)',
    keys: [
      'DRIVER_ACTIVE',
      'DRIVER_ON_LOAD',
      'DRIVER_INACTIVE',
      'DRIVER_OFF_DUTY',
      'DRIVER_AVAILABLE',
      'DRIVER_UNAVAILABLE',
    ],
  },
  {
    title: 'Vehicle Status (3) + Ownership (3)',
    keys: ['VEHICLE_ACTIVE', 'VEHICLE_MAINTENANCE', 'VEHICLE_INACTIVE', 'OWNED', 'LEASED', 'FINANCED'],
  },
  {
    title: 'Customer / Contact (5)',
    keys: ['CUSTOMER_ACTIVE', 'CUSTOMER_INACTIVE', 'BROKER', 'DIRECT_SHIPPER', 'THREE_PL'],
  },
  {
    title: 'Onboarding / Compliance (5)',
    keys: [
      'ONBOARDING_COMPLETE',
      'ONBOARDING_INCOMPLETE',
      'INSURANCE_WARNING_30',
      'INSURANCE_WARNING_7',
      'INSURANCE_EXPIRED',
    ],
  },
  {
    title: 'Stop Status (3)',
    keys: ['STOP_COMPLETE', 'STOP_IN_PROGRESS', 'STOP_PENDING'],
  },
  {
    title: 'Payroll Status (4)',
    keys: ['PAYROLL_PENDING', 'PAYROLL_REVIEWED', 'PAYROLL_APPROVED', 'PAYROLL_PAID'],
  },
  {
    title: 'Document Status (3)',
    keys: ['DOC_PRESENT', 'DOC_MISSING', 'DOC_REQUIRED'],
  },
  {
    title: 'Driver Type (2)',
    keys: ['TYPE_1099', 'TYPE_W2'],
  },
];

const StatusBadgeSection = () => (
  <Stack spacing={3}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      StatusBadge — all categories (medium + small sizes)
    </Typography>

    {BADGE_GROUPS.map((group) => (
      <Box key={group.title}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {group.title}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
          {group.keys.map((key) => (
            <Stack
              key={key}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                px: 1.5,
                py: 0.75,
              }}
            >
              <StatusBadge status={key} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace' }}
              >
                {key}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {group.keys.map((key) => (
            <StatusBadge key={`${key}-small`} status={key} size="small" />
          ))}
        </Stack>
        <Divider sx={{ mt: 2 }} />
      </Box>
    ))}
  </Stack>
);

export default StatusBadgeSection;
