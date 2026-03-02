import type { LoadStatus } from './loadStatuses';

export interface KanbanGroup {
  readonly label: string;
  readonly color: string;
  readonly statuses: readonly LoadStatus[];
}

export interface KanbanGroupMap {
  readonly NEW: KanbanGroup;
  readonly BOOKED: KanbanGroup;
  readonly ACTIVE: KanbanGroup;
  readonly DELIVERED: KanbanGroup;
  readonly COMPLETE: KanbanGroup;
  readonly ISSUES: KanbanGroup;
}

export const KANBAN_GROUPS: KanbanGroupMap = Object.freeze({
  NEW: Object.freeze({
    label: 'New',
    color: 'yellow',
    statuses: Object.freeze(['QUOTED'] as const),
  }),
  BOOKED: Object.freeze({
    label: 'Booked',
    color: 'orange',
    statuses: Object.freeze(['BOOKED'] as const),
  }),
  ACTIVE: Object.freeze({
    label: 'Active',
    color: 'green',
    statuses: Object.freeze([
      'DISPATCHED',
      'EN_ROUTE_PICKUP',
      'AT_PICKUP',
      'IN_TRANSIT',
      'AT_DELIVERY',
    ] as const),
  }),
  DELIVERED: Object.freeze({
    label: 'Delivered',
    color: 'purple',
    statuses: Object.freeze(['DELIVERED', 'INVOICE_PENDING'] as const),
  }),
  COMPLETE: Object.freeze({
    label: 'Complete',
    color: 'gray',
    statuses: Object.freeze(['INVOICED', 'PAID'] as const),
  }),
  ISSUES: Object.freeze({
    label: 'Issues',
    color: 'red',
    statuses: Object.freeze(['EXCEPTION', 'CANCELED', 'TONU'] as const),
  }),
});

export type KanbanGroupKey = keyof KanbanGroupMap;
