import { format, parseISO } from 'date-fns';
import { DOCUMENT_CONTEXTS, DOC_TYPE_CONFIG } from 'features/documents/constants';
import type { DocumentType } from 'features/documents/types';
import type { ChipColor } from 'types/chipColor';
import type { KanbanGroup, LoadStatus, Stop, StopType } from './types';

export const LOAD_STATUSES: readonly LoadStatus[] = [
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
] as const;

export const STATUS_LABELS: Record<LoadStatus, string> = {
  QUOTED: 'Quoted',
  BOOKED: 'Booked',
  DISPATCHED: 'Dispatched',
  EN_ROUTE_PICKUP: 'En Route to Pickup',
  AT_PICKUP: 'At Pickup',
  IN_TRANSIT: 'In Transit',
  AT_DELIVERY: 'At Delivery',
  DELIVERED: 'Delivered',
  INVOICE_PENDING: 'Invoice Pending',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  EXCEPTION: 'Exception',
  CANCELED: 'Canceled',
  TONU: 'TONU',
};

export const STATUS_COLORS: Record<LoadStatus, ChipColor> = {
  QUOTED: 'default',
  BOOKED: 'info',
  DISPATCHED: 'secondary',
  EN_ROUTE_PICKUP: 'primary',
  AT_PICKUP: 'warning',
  IN_TRANSIT: 'primary',
  AT_DELIVERY: 'warning',
  DELIVERED: 'success',
  INVOICE_PENDING: 'secondary',
  INVOICED: 'info',
  PAID: 'success',
  EXCEPTION: 'error',
  CANCELED: 'default',
  TONU: 'error',
};

export const KANBAN_GROUPS: readonly { key: KanbanGroup; label: string }[] = [
  { key: 'NEW', label: 'New' },
  { key: 'BOOKED', label: 'Booked' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETE', label: 'Complete' },
  { key: 'ISSUES', label: 'Issues' },
] as const;

/**
 * Maps each LoadStatus to its kanban column group.
 */
export const STATUS_TO_KANBAN_GROUP: Record<LoadStatus, KanbanGroup> = {
  QUOTED: 'NEW',
  BOOKED: 'BOOKED',
  DISPATCHED: 'ACTIVE',
  EN_ROUTE_PICKUP: 'ACTIVE',
  AT_PICKUP: 'ACTIVE',
  IN_TRANSIT: 'ACTIVE',
  AT_DELIVERY: 'ACTIVE',
  DELIVERED: 'DELIVERED',
  INVOICE_PENDING: 'COMPLETE',
  INVOICED: 'COMPLETE',
  PAID: 'COMPLETE',
  EXCEPTION: 'ISSUES',
  CANCELED: 'ISSUES',
  TONU: 'ISSUES',
};

// ---------------------------------------------------------------------------
// Status transition mapping (happy path + alternatives)
// ---------------------------------------------------------------------------

export const NEXT_STATUS: Partial<Record<LoadStatus, LoadStatus>> = {
  QUOTED: 'BOOKED',
  BOOKED: 'DISPATCHED',
  DISPATCHED: 'EN_ROUTE_PICKUP',
  EN_ROUTE_PICKUP: 'AT_PICKUP',
  AT_PICKUP: 'IN_TRANSIT',
  IN_TRANSIT: 'AT_DELIVERY',
  AT_DELIVERY: 'DELIVERED',
  DELIVERED: 'INVOICE_PENDING',
  INVOICE_PENDING: 'INVOICED',
  INVOICED: 'PAID',
};

export const NEXT_STATUS_LABELS: Partial<Record<LoadStatus, string>> = {
  QUOTED: 'Mark Booked',
  BOOKED: 'Mark Dispatched',
  DISPATCHED: 'Mark En Route',
  EN_ROUTE_PICKUP: 'Mark At Pickup',
  AT_PICKUP: 'Mark In Transit',
  IN_TRANSIT: 'Mark At Delivery',
  AT_DELIVERY: 'Mark Delivered',
  DELIVERED: 'Mark Invoice Pending',
  INVOICE_PENDING: 'Mark Invoiced',
  INVOICED: 'Mark Paid',
};

export const ALTERNATIVE_STATUSES: Partial<Record<LoadStatus, LoadStatus[]>> = {
  QUOTED: ['CANCELED'],
  BOOKED: ['CANCELED', 'TONU'],
  DISPATCHED: ['EXCEPTION', 'CANCELED', 'TONU'],
  EN_ROUTE_PICKUP: ['EXCEPTION', 'TONU'],
  AT_PICKUP: ['EXCEPTION'],
  IN_TRANSIT: ['EXCEPTION'],
  AT_DELIVERY: ['EXCEPTION'],
  DELIVERED: ['EXCEPTION'],
};

// ---------------------------------------------------------------------------
// Transition prerequisites — fields that must be populated for a target status
// ---------------------------------------------------------------------------

export const TRANSITION_PREREQUISITES: Partial<Record<string, { field: string; label: string }[]>> =
  {
    BOOKED: [{ field: 'carrierId', label: 'Carrier assigned' }],
    DISPATCHED: [
      { field: 'carrierId', label: 'Carrier assigned' },
      { field: 'driverId', label: 'Driver assigned' },
      { field: 'vehicleId', label: 'Vehicle assigned' },
      { field: 'customerRate', label: 'Customer rate set' },
      { field: 'rateConReceivedAt', label: 'Rate confirmation on file' },
    ],
  };

// ---------------------------------------------------------------------------
// Load detail tabs
// ---------------------------------------------------------------------------

export const LOAD_DETAIL_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'financials', label: 'Financials' },
  { value: 'documents', label: 'Documents' },
  { value: 'notifications', label: 'Notifications' },
] as const;

// ---------------------------------------------------------------------------
// Date & currency formatters
// ---------------------------------------------------------------------------

/**
 * Formats an appointment date + time pair.
 * Returns "Feb 27, 8:00 AM" or just the date/time if only one is provided.
 */
export const formatAppointmentDateTime = (
  dateStr: string | null,
  timeStr: string | null,
): string => {
  if (!dateStr && !timeStr) return '\u2014';
  if (dateStr && timeStr) {
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const combined = parseISO(`${dateOnly}T${timeStr}`);
    return format(combined, 'MMM d, h:mm a');
  }
  if (dateStr) {
    const d = parseISO(dateStr);
    return format(d, 'MMM d, yyyy');
  }
  return timeStr ?? '\u2014';
};

/**
 * Formats an ISO timestamp to "Feb 27, 8:00 AM".
 */
export const formatTimestamp = (iso: string): string => {
  const d = parseISO(iso);
  return format(d, 'MMM d, h:mm a');
};

/**
 * Formats a numeric value as currency: "$2,800.00".
 */
export const formatCurrency = (value: string | number | null): string => {
  if (value === null || value === undefined) return '\u2014';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '\u2014';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
};

/**
 * Formats a numeric value as compact currency: "$2,800".
 */
export const formatCurrencyCompact = (value: string | number | null): string => {
  if (value === null || value === undefined) return '\u2014';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '\u2014';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
};

// ---------------------------------------------------------------------------
// Stop status derivation
// ---------------------------------------------------------------------------

export interface StopStatusInfo {
  label: string;
  color: 'success' | 'info' | 'default';
}

/**
 * Derives visual stop status from arrival/departure times.
 */
export const getStopStatus = (
  stop: Stop,
  allStops: Stop[],
  _loadStatus: LoadStatus,
): StopStatusInfo => {
  if (stop.departureTime) {
    return { label: 'Complete', color: 'success' };
  }

  if (stop.arrivalTime) {
    return { label: 'In Progress', color: 'info' };
  }

  // Check if the previous stop (by sequence) is complete
  const sorted = [...allStops].sort((a, b) => a.sequence - b.sequence);
  const currentIndex = sorted.findIndex((s) => s.id === stop.id);
  if (currentIndex > 0) {
    const prevStop = sorted[currentIndex - 1];
    if (prevStop.departureTime) {
      return { label: 'In Transit', color: 'info' };
    }
  }

  return { label: 'Pending', color: 'default' };
};

export const STOP_TYPE_CONFIG: Record<StopType, { abbr: string; color: string }> = {
  PICKUP: { abbr: 'P', color: 'primary.main' },
  DELIVERY: { abbr: 'D', color: 'success.main' },
  STOP_OFF: { abbr: 'S', color: 'warning.main' },
  DROP_HOOK: { abbr: 'DH', color: 'secondary.main' },
  LIVE_UNLOAD: { abbr: 'LU', color: 'info.main' },
};

export const EQUIPMENT_OPTIONS = [
  { label: 'Dry Van', value: 'DRY_VAN' },
  { label: 'Reefer', value: 'REEFER' },
  { label: 'Flatbed', value: 'FLATBED' },
  { label: 'Step Deck', value: 'STEP_DECK' },
  { label: 'Box Truck', value: 'BOX_TRUCK' },
  { label: 'Hotshot', value: 'HOTSHOT' },
  { label: 'Power Only', value: 'POWER_ONLY' },
];

export const formatEquipmentType = (type: string | null): string => {
  if (!type) return '\u2014';
  return EQUIPMENT_OPTIONS.find((opt) => opt.value === type)?.label ?? type;
};

// ---------------------------------------------------------------------------
// Load type configuration
// ---------------------------------------------------------------------------

export const LOAD_TYPE_OPTIONS = [
  { key: 'std', label: 'Standard', description: 'Single pickup, single delivery' },
  { key: 'mp1d', label: 'Multi-Pickup', description: 'Multiple pickups, one delivery' },
  { key: '1pmd', label: 'Multi-Drop', description: 'One pickup, multiple deliveries' },
  { key: 'mpmd', label: 'Multi-Stop', description: 'Multiple pickups and deliveries' },
  { key: 'dh', label: 'Drop & Hook', description: 'Drop trailer, hook loaded trailer' },
  { key: 'po', label: 'Power Only', description: 'Tractor only, no trailer' },
] as const;

export interface StopConfig {
  type: 'PICKUP' | 'DELIVERY';
  appointmentType?: string;
}

export const LOAD_TYPE_STOP_CONFIG: Record<string, StopConfig[]> = {
  std: [{ type: 'PICKUP' }, { type: 'DELIVERY' }],
  mp1d: [{ type: 'PICKUP' }, { type: 'PICKUP' }, { type: 'DELIVERY' }],
  '1pmd': [{ type: 'PICKUP' }, { type: 'DELIVERY' }, { type: 'DELIVERY' }],
  mpmd: [{ type: 'PICKUP' }, { type: 'PICKUP' }, { type: 'DELIVERY' }, { type: 'DELIVERY' }],
  dh: [
    { type: 'PICKUP', appointmentType: 'drop' },
    { type: 'DELIVERY', appointmentType: 'drop' },
  ],
  po: [{ type: 'PICKUP' }, { type: 'DELIVERY' }],
};

// ---------------------------------------------------------------------------
// Stop field options
// ---------------------------------------------------------------------------

export const STOP_SUBTYPE_OPTIONS = {
  PICKUP: [
    { label: 'Shipper', value: 'shipper' },
    { label: 'Cross-dock', value: 'crossdock' },
  ],
  DELIVERY: [
    { label: 'Consignee', value: 'consignee' },
    { label: 'Cross-dock', value: 'crossdock' },
  ],
} as const;

export const APPOINTMENT_TYPE_OPTIONS = [
  { label: 'Live', value: 'live' },
  { label: 'Drop', value: 'drop' },
  { label: 'FCFS', value: 'fcfs' },
  { label: 'Pre-set', value: 'pre' },
] as const;

// ---------------------------------------------------------------------------
// Rate & financials
// ---------------------------------------------------------------------------

export const ACCESSORIAL_TYPE_OPTIONS = [
  { key: 'fsc', label: 'Fuel Surcharge', defaultApplies: 'both', placeholder: '' },
  { key: 'det', label: 'Detention', defaultApplies: 'carrier', placeholder: '' },
  { key: 'lump', label: 'Lumper', defaultApplies: 'customer', placeholder: '' },
  { key: 'tonu', label: 'TONU', defaultApplies: 'carrier', placeholder: '' },
] as const;

export const CARRIER_PERCENT_PRESETS = [70, 80, 85, 90] as const;

const BROKER_PAYMENT_TERMS_MAP: Record<string, string> = {
  quick_pay: 'quick_pay',
  net_15: 'net_15',
  net_30: 'net_30',
  net_45: 'net_45',
  'Quick Pay': 'quick_pay',
  'Net 15': 'net_15',
  'Net 30': 'net_30',
  'Net 45': 'net_45',
};

export const mapBrokerPaymentTerms = (brokerTerms: string): string | undefined =>
  BROKER_PAYMENT_TERMS_MAP[brokerTerms];

export const PAYMENT_TERMS_OPTIONS = [
  { label: 'Quick Pay (2 days)', value: 'quick_pay' },
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 45', value: 'net_45' },
] as const;

// ---------------------------------------------------------------------------
// Equipment-specific options
// ---------------------------------------------------------------------------

export const REEFER_MODE_OPTIONS = [
  { label: 'Continuous', value: 'continuous' },
  { label: 'Cycle Sentry', value: 'cycle-sentry' },
] as const;

export const FLATBED_LENGTH_OPTIONS = [
  { label: '48 ft', value: 48 },
  { label: '53 ft', value: 53 },
] as const;

export const TARP_TYPE_OPTIONS = [
  { label: 'No Tarp', value: 'none' },
  { label: 'Yes — 4ft', value: '4ft' },
  { label: 'Yes — 6ft', value: '6ft' },
] as const;

// ---------------------------------------------------------------------------
// Rate intelligence constants
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Document types available during load creation
// ---------------------------------------------------------------------------

export const CREATE_LOAD_DOCUMENT_TYPES: readonly { label: string; value: DocumentType }[] =
  DOCUMENT_CONTEXTS['create-load'].map((type) => ({
    label: DOC_TYPE_CONFIG[type].label,
    value: type,
  }));

export const CREATE_LOAD_DOC_CARD_CONFIG: readonly {
  type: DocumentType;
  shortLabel: string;
  description: string;
}[] = [
  { type: 'BROKER_RATE_CON', shortLabel: 'Rate Con', description: 'Broker rate confirmation' },
  { type: 'BOL_UNSIGNED', shortLabel: 'BOL', description: 'Bill of lading' },
  { type: 'HAZMAT', shortLabel: 'Hazmat', description: 'Hazmat documentation' },
  { type: 'LOA', shortLabel: 'LOA / Special', description: 'Letter of authority' },
  { type: 'LUMPER_RECEIPT', shortLabel: 'Lumper Receipt', description: 'Lumper reimbursement' },
  { type: 'SCALE_TICKET', shortLabel: 'Weight Ticket', description: 'Scale weight ticket' },
];

export const SCHEDULING_TYPE_OPTIONS = [
  { value: 'APPOINTMENT', label: 'Appt', hint: 'Scheduled appointment \u2014 requires date, time, and confirmation #' },
  { value: 'FCFS', label: 'FCFS', hint: 'First come first served \u2014 show up during facility hours' },
  { value: 'NOTIFICATION', label: 'Notify', hint: 'Call ahead before arrival \u2014 requires contact info' },
  { value: 'OPEN', label: 'Open', hint: 'Open dock \u2014 arrive any time during business hours' },
  { value: 'DROP_HOOK', label: 'Drop', hint: 'Drop trailer at yard \u2014 no dock interaction needed' },
] as const;

export type SchedulingType = typeof SCHEDULING_TYPE_OPTIONS[number]['value'];

export const SCHEDULING_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SCHEDULING_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

export const MARGIN_THRESHOLDS = { good: 20, ok: 10 } as const;
export const MARKET_RPM = 3.8;
export const MIN_BOOK = 900;

