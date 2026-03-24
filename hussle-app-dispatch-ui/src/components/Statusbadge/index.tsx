/**
 * StatusBadge — Hussle Dispatch / FleetCommand
 *
 * Replaces the generic StatusChip component.
 * Each status maps to a specific color combination from the codebase palette.
 * The component resolves its own color internally — callers pass only the status string.
 *
 * Keys are UPPER_CASE to match backend Prisma enums.
 * The component normalizes defensively via .toUpperCase() so callers can pass any case.
 *
 * Usage:
 *   import { StatusBadge } from 'components/StatusBadge';
 *
 *   <StatusBadge status="BOOKED" />
 *   <StatusBadge status="delivered" />
 *   <StatusBadge status="OVERDUE" size="small" />
 *
 * One-off label override:
 *   <StatusBadge status="IN_TRANSIT" label="On The Way" />
 */

import { Box, SxProps, Theme } from '@mui/material';

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE TOKENS — from codebase Palette.ts
// Using hex directly so this component works standalone without theme access.
// ─────────────────────────────────────────────────────────────────────────────

const P = {
  // Primary blue
  p100: '#E6F6FF',
  p200: '#BAE3FF',
  p300: '#7CC4FA',
  p600: '#0967D2',
  p700: '#0552B5',
  p800: '#03449E',

  // Secondary green
  s100: '#E3F9E5',
  s200: '#C1F2C7',
  s600: '#18981D',
  s700: '#0F8613',
  s800: '#0E7817',

  // Grey
  g100: '#F5F7FA',
  g200: '#E4E7EB',
  g300: '#CBD2D9',
  g500: '#7B8794',
  g600: '#616E7C',
  g700: '#52606D',

  // Amber/Warning
  w50: '#FFFBEB',
  w100: '#FEF3C7',
  w200: '#FDE68A',
  w600: '#D97706',
  w700: '#B45309',

  // Red/Error
  r50: '#FEF2F2',
  r100: '#FEE2E2',
  r200: '#FECACA',
  r600: '#DC2626',
  r700: '#B91C1C',

  // Purple (Dispatched — distinct from blue/green)
  pu50: '#F5F3FF',
  pu200: '#DDD6FE',
  pu600: '#7C3AED',
  pu700: '#6D28D9',

  // Orange (At Pickup / At Delivery — distinct from amber)
  o50: '#FFF7ED',
  o200: '#FED7AA',
  o600: '#EA580C',
  o700: '#C2410C',

  // Teal (En Route — movement, directional)
  t50: '#F0FDFA',
  t200: '#99F6E4',
  t600: '#0D9488',
  t700: '#0F766E',
};

// ─────────────────────────────────────────────────────────────────────────────
// COLOR CONFIG — one entry per status
// Keys are UPPER_CASE to match backend Prisma enums.
// bg: background fill
// color: text color (always darkest shade of same ramp)
// border: border color (mid-tone of same ramp)
// dot: show a filled circle prefix (for active/live states)
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeStyle {
  bg: string;
  color: string;
  border: string;
  dot?: boolean;
  label?: string; // default display label
}

const STATUS_CONFIG: Record<string, BadgeStyle> = {
  // ── LOAD STATUS ────────────────────────────────────────────────────────────

  QUOTED: {
    bg: P.g100,
    color: P.g700,
    border: P.g300,
    label: 'Quoted',
  },
  BOOKED: {
    bg: P.p100,
    color: P.p800,
    border: P.p200,
    label: 'Booked',
  },
  DISPATCHED: {
    bg: P.pu50,
    color: P.pu700,
    border: P.pu200,
    label: 'Dispatched',
  },
  EN_ROUTE_PICKUP: {
    bg: P.t50,
    color: P.t700,
    border: P.t200,
    dot: true,
    label: 'En Route to Pickup',
  },
  AT_PICKUP: {
    bg: P.o50,
    color: P.o700,
    border: P.o200,
    dot: true,
    label: 'At Pickup',
  },
  IN_TRANSIT: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    dot: true,
    label: 'In Transit',
  },
  AT_DELIVERY: {
    bg: P.o50,
    color: P.o700,
    border: P.o200,
    dot: true,
    label: 'At Delivery',
  },
  DELIVERED: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    dot: true,
    label: 'Delivered',
  },
  INVOICE_PENDING: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Invoice Pending',
  },
  INVOICED: {
    bg: P.p100,
    color: P.p600,
    border: P.p200,
    label: 'Invoiced',
  },
  PAID: {
    bg: P.s100,
    color: P.s800,
    border: P.s200,
    label: 'Paid',
  },
  EXCEPTION: {
    bg: P.r50,
    color: P.r700,
    border: P.r200,
    label: 'Exception',
  },
  CANCELED: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Canceled',
  },
  TONU: {
    bg: P.r50,
    color: P.r700,
    border: P.r200,
    label: 'TONU',
  },

  // ── INVOICE STATUS ─────────────────────────────────────────────────────────

  DRAFT: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Draft',
  },
  APPROVED: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    label: 'Approved',
  },
  SENT: {
    bg: P.p100,
    color: P.p800,
    border: P.p200,
    label: 'Sent',
  },
  PARTIALLY_PAID: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Partially Paid',
  },
  OVERDUE: {
    bg: P.r50,
    color: P.r700,
    border: P.r200,
    label: 'Overdue',
  },
  VOID: {
    bg: P.g100,
    color: P.g500,
    border: P.g200,
    label: 'Void',
  },

  // ── INVOICE READINESS ─────────────────────────────────────────────────────

  NOT_READY: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Not Ready',
  },
  AWAITING_DOCUMENTS: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Awaiting Docs',
  },
  READY: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    label: 'Ready',
  },
  INVOICE_CREATED: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    label: 'Invoice Created',
  },

  // ── CARRIER STATUS ─────────────────────────────────────────────────────────

  CARRIER_ACTIVE: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    dot: true,
    label: 'Active',
  },
  CARRIER_PENDING: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Pending',
  },
  CARRIER_SUSPENDED: {
    bg: P.r50,
    color: P.r700,
    border: P.r200,
    label: 'Suspended',
  },
  CARRIER_DRAFT: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Draft',
  },

  // ── DRIVER STATUS ──────────────────────────────────────────────────────────

  DRIVER_ACTIVE: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    dot: true,
    label: 'Active',
  },
  DRIVER_ON_LOAD: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    dot: true,
    label: 'On Load',
  },
  DRIVER_INACTIVE: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Inactive',
  },
  DRIVER_OFF_DUTY: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Off Duty',
  },
  DRIVER_AVAILABLE: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    dot: true,
    label: 'Available',
  },
  DRIVER_UNAVAILABLE: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Unavailable',
  },

  // ── VEHICLE STATUS ─────────────────────────────────────────────────────────

  VEHICLE_ACTIVE: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    dot: true,
    label: 'Active',
  },
  VEHICLE_MAINTENANCE: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'In Maintenance',
  },
  VEHICLE_INACTIVE: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Inactive',
  },
  OWNED: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    label: 'Owned',
  },
  LEASED: {
    bg: P.pu50,
    color: P.pu700,
    border: P.pu200,
    label: 'Leased',
  },
  FINANCED: {
    bg: P.t50,
    color: P.t700,
    border: P.t200,
    label: 'Financed',
  },

  // ── CUSTOMER / CONTACT ─────────────────────────────────────────────────────

  CUSTOMER_ACTIVE: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    label: 'Active',
  },
  CUSTOMER_INACTIVE: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Inactive',
  },
  BROKER: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    label: 'Broker',
  },
  DIRECT_SHIPPER: {
    bg: P.t50,
    color: P.t700,
    border: P.t200,
    label: 'Direct Shipper',
  },
  THREE_PL: {
    bg: P.pu50,
    color: P.pu700,
    border: P.pu200,
    label: '3PL',
  },

  // ── ONBOARDING / COMPLIANCE ────────────────────────────────────────────────

  ONBOARDING_COMPLETE: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    label: 'Complete',
  },
  ONBOARDING_INCOMPLETE: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Incomplete',
  },
  INSURANCE_WARNING_30: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: '30 Day Warning',
  },
  INSURANCE_WARNING_7: {
    bg: P.r50,
    color: P.r700,
    border: P.r200,
    label: '7 Day Warning',
  },
  INSURANCE_EXPIRED: {
    bg: P.r50,
    color: P.r700,
    border: P.r100,
    label: 'Expired',
  },

  // ── STOP STATUS ────────────────────────────────────────────────────────────

  STOP_COMPLETE: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    label: 'Complete',
  },
  STOP_IN_PROGRESS: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    dot: true,
    label: 'In Progress',
  },
  STOP_PENDING: {
    bg: P.g100,
    color: P.g600,
    border: P.g200,
    label: 'Pending',
  },

  // ── PAYROLL STATUS ─────────────────────────────────────────────────────────

  PAYROLL_PENDING: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Pending',
  },
  PAYROLL_REVIEWED: {
    bg: P.p100,
    color: P.p700,
    border: P.p200,
    label: 'Reviewed',
  },
  PAYROLL_APPROVED: {
    bg: P.pu50,
    color: P.pu700,
    border: P.pu200,
    label: 'Approved',
  },
  PAYROLL_PAID: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    label: 'Paid',
  },

  // ── DOCUMENT STATUS ────────────────────────────────────────────────────────

  DOC_PRESENT: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    label: 'Present',
  },
  DOC_MISSING: {
    bg: P.w50,
    color: P.w700,
    border: P.w200,
    label: 'Missing',
  },
  DOC_REQUIRED: {
    bg: P.r50,
    color: P.r700,
    border: P.r200,
    label: 'Required',
  },

  // ── DRIVER TYPE ────────────────────────────────────────────────────────────

  TYPE_1099: {
    bg: P.pu50,
    color: P.pu700,
    border: P.pu200,
    label: '1099',
  },
  TYPE_W2: {
    bg: P.s100,
    color: P.s700,
    border: P.s200,
    label: 'W2',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK — unknown status
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK: BadgeStyle = {
  bg: P.g100,
  color: P.g600,
  border: P.g200,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export type StatusKey = keyof typeof STATUS_CONFIG;

interface StatusBadgeProps {
  /** Status key from STATUS_CONFIG — e.g. "BOOKED", "IN_TRANSIT", "PAID" */
  status: StatusKey | string;
  /** Override the default label */
  label?: string;
  /** Size variant — defaults to "medium" */
  size?: 'small' | 'medium';
  /** Additional MUI sx overrides */
  sx?: SxProps<Theme>;
}

export function StatusBadge({ status, label, size = 'medium', sx }: StatusBadgeProps) {
  const key = status.toUpperCase();
  const config = STATUS_CONFIG[key] ?? FALLBACK;
  const displayLabel = label ?? config.label ?? status;

  const isSmall = size === 'small';

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isSmall ? '1px 6px' : '3px 9px',
        borderRadius: '20px',
        border: `1px solid ${config.border}`,
        background: config.bg,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: isSmall ? '10px' : '11px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: config.color,
        ...sx,
      }}
    >
      {config.dot && (
        <Box
          component="span"
          sx={{
            width: isSmall ? '5px' : '6px',
            height: isSmall ? '5px' : '6px',
            borderRadius: '50%',
            background: config.color,
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — StatusBadge for use inside AG Grid cells
// Wraps in a div with vertical centering for table row alignment
// ─────────────────────────────────────────────────────────────────────────────

interface StatusCellProps {
  status: StatusKey | string;
  size?: 'small' | 'medium';
}

export function StatusCell({ status, size }: StatusCellProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <StatusBadge status={status} size={size} />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS — status key constants for use in column definitions
// Values are UPPER_CASE to match backend Prisma enums.
// ─────────────────────────────────────────────────────────────────────────────

export const LOAD_STATUS = {
  QUOTED: 'QUOTED',
  BOOKED: 'BOOKED',
  DISPATCHED: 'DISPATCHED',
  EN_ROUTE_PICKUP: 'EN_ROUTE_PICKUP',
  AT_PICKUP: 'AT_PICKUP',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_DELIVERY: 'AT_DELIVERY',
  DELIVERED: 'DELIVERED',
  INVOICE_PENDING: 'INVOICE_PENDING',
  INVOICED: 'INVOICED',
  PAID: 'PAID',
  EXCEPTION: 'EXCEPTION',
  CANCELED: 'CANCELED',
  TONU: 'TONU',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  SENT: 'SENT',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID',
} as const;

export const INVOICE_READINESS = {
  NOT_READY: 'NOT_READY',
  AWAITING_DOCUMENTS: 'AWAITING_DOCUMENTS',
  READY: 'READY',
  INVOICE_CREATED: 'INVOICE_CREATED',
} as const;

export const DRIVER_STATUS = {
  ACTIVE: 'DRIVER_ACTIVE',
  ON_LOAD: 'DRIVER_ON_LOAD',
  INACTIVE: 'DRIVER_INACTIVE',
  OFF_DUTY: 'DRIVER_OFF_DUTY',
  AVAILABLE: 'DRIVER_AVAILABLE',
  UNAVAILABLE: 'DRIVER_UNAVAILABLE',
} as const;

export const CARRIER_STATUS = {
  ACTIVE: 'CARRIER_ACTIVE',
  PENDING: 'CARRIER_PENDING',
  SUSPENDED: 'CARRIER_SUSPENDED',
  DRAFT: 'CARRIER_DRAFT',
} as const;

export const VEHICLE_STATUS = {
  ACTIVE: 'VEHICLE_ACTIVE',
  MAINTENANCE: 'VEHICLE_MAINTENANCE',
  INACTIVE: 'VEHICLE_INACTIVE',
} as const;

export const PAYROLL_STATUS = {
  PENDING: 'PAYROLL_PENDING',
  REVIEWED: 'PAYROLL_REVIEWED',
  APPROVED: 'PAYROLL_APPROVED',
  PAID: 'PAYROLL_PAID',
} as const;

export const DOC_STATUS = {
  PRESENT: 'DOC_PRESENT',
  MISSING: 'DOC_MISSING',
  REQUIRED: 'DOC_REQUIRED',
} as const;

export const DRIVER_TYPE = {
  OO_1099: 'TYPE_1099',
  W2: 'TYPE_W2',
} as const;
