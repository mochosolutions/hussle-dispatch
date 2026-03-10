import type { KanbanGroup, LoadStatus } from './types';

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

export const STATUS_COLORS: Record<LoadStatus, string> = {
  QUOTED: 'text.secondary',
  BOOKED: 'info.main',
  DISPATCHED: 'info.dark',
  EN_ROUTE_PICKUP: 'primary.main',
  AT_PICKUP: 'primary.dark',
  IN_TRANSIT: 'primary.main',
  AT_DELIVERY: 'primary.dark',
  DELIVERED: 'success.light',
  INVOICE_PENDING: 'warning.main',
  INVOICED: 'warning.dark',
  PAID: 'success.main',
  EXCEPTION: 'error.main',
  CANCELED: 'text.disabled',
  TONU: 'error.dark',
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
