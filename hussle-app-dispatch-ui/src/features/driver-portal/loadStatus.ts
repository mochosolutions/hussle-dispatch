import type { ChipColor } from 'types/chipColor';

// Status display names shown to the driver.
export const STATUS_LABELS: Record<string, string> = {
  DISPATCHED: 'Dispatched',
  EN_ROUTE_PICKUP: 'En Route to Pickup',
  AT_PICKUP: 'At Pickup',
  IN_TRANSIT: 'In Transit',
  AT_DELIVERY: 'At Delivery',
  DELIVERED: 'Delivered',
  INVOICE_PENDING: 'Delivered',
  INVOICED: 'Delivered',
  PAID: 'Delivered',
};

// Stop scheduling type display names.
export const SCHEDULING_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Scheduled appointment',
  FCFS: 'First-come, first-served',
  NOTIFICATION: 'Notification required',
  OPEN: 'Open dock',
  DROP_HOOK: 'Drop & hook',
};

// Next status in the driver flow, keyed by current status.
export const NEXT_STATUS: Record<string, string> = {
  DISPATCHED: 'EN_ROUTE_PICKUP',
  EN_ROUTE_PICKUP: 'AT_PICKUP',
  AT_PICKUP: 'IN_TRANSIT',
  IN_TRANSIT: 'AT_DELIVERY',
  AT_DELIVERY: 'DELIVERED',
};

export const NEXT_STATUS_BUTTON_LABELS: Record<string, string> = {
  DISPATCHED: 'Start Route to Pickup',
  EN_ROUTE_PICKUP: 'Arrived at Pickup',
  AT_PICKUP: 'Loaded — Start Transit',
  IN_TRANSIT: 'Arrived at Delivery',
  AT_DELIVERY: 'Mark Delivered',
};

export const STATUS_COLORS: Record<string, ChipColor> = {
  DISPATCHED: 'info',
  EN_ROUTE_PICKUP: 'info',
  AT_PICKUP: 'warning',
  IN_TRANSIT: 'primary',
  AT_DELIVERY: 'warning',
  DELIVERED: 'success',
};

// Ordered stages used to render the delivery progress strip ("Stage X of 6").
export const DELIVERY_SEQUENCE: string[] = [
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
];

const TERMINAL_STATUSES = new Set([
  'DELIVERED',
  'INVOICE_PENDING',
  'INVOICED',
  'PAID',
  'CANCELED',
  'TONU',
]);

export const isTerminalStatus = (status: string): boolean => TERMINAL_STATUSES.has(status);

export const DOC_UPLOAD_STATUSES = new Set(['AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY', 'DELIVERED']);
export const POD_UPLOAD_STATUSES = new Set(['AT_DELIVERY', 'DELIVERED']);

// Load has been invoiced (or paid) — the driver's work is done, so the portal
// shows a read-only completed state with no upload/note actions.
export const COMPLETED_STATUSES = new Set(['INVOICE_PENDING', 'INVOICED', 'PAID']);

// Load was canceled before completion — closed, read-only.
export const CLOSED_STATUSES = new Set(['CANCELED', 'TONU']);
