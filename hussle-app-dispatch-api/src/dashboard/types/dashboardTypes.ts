import type Decimal from 'decimal.js';

// ---------------------------------------------------------------------------
// KPI types
// ---------------------------------------------------------------------------

export interface KanbanCounts {
  NEW: number;
  BOOKED: number;
  ACTIVE: number;
  DELIVERED: number;
  COMPLETE: number;
  ISSUES: number;
}

export interface RevenueKpis {
  revenueThisWeek: Decimal;
  revenueThisMonth: Decimal;
  dispatchFeesThisMonth: Decimal;
  partnerSplitThisMonth: Decimal | null; // ADMIN only
}

export interface OverdueInvoiceKpis {
  count: number;
  total: Decimal;
}

export interface DashboardKpis {
  kanbanCounts: KanbanCounts;
  revenue: RevenueKpis;
  overdueInvoices: OverdueInvoiceKpis;
}

// ---------------------------------------------------------------------------
// Attention item types
// ---------------------------------------------------------------------------

export interface AttentionItem {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  entityId: string;
  entityType: string;
}

// ---------------------------------------------------------------------------
// Service input types
// ---------------------------------------------------------------------------

export interface GetKpisInput {
  organizationId: string;
  role: string;
}

export interface GetAttentionItemsInput {
  organizationId: string;
}

// ---------------------------------------------------------------------------
// Dashboard query port
// ---------------------------------------------------------------------------

export interface DashboardQueryPort {
  countLoadsByStatus(
    organizationId: string,
    statuses: string[],
  ): Promise<number>;

  sumRevenueInDateRange(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Decimal>;

  sumDispatchFeesInDateRange(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Decimal>;

  sumPartnerSplitInDateRange(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Decimal>;

  countOverdueInvoices(organizationId: string): Promise<number>;
  sumOverdueInvoices(organizationId: string): Promise<Decimal>;

  getLoadsInException(organizationId: string): Promise<{ id: string; loadNumber: string }[]>;
  getOverdueInvoices(
    organizationId: string,
  ): Promise<{ id: string; invoiceNumber: string; dueDate: Date }[]>;
  getLoadsWithoutRateCon(
    organizationId: string,
  ): Promise<{ id: string; loadNumber: string }[]>;
  getInvoicesMissingBol(
    organizationId: string,
  ): Promise<{ id: string; invoiceNumber: string }[]>;
  getCarriersWithExpiringInsurance(
    organizationId: string,
    withinDays: number,
  ): Promise<{ id: string; name: string; insuranceExpiry: Date }[]>;
  getBookedLoadsWithPickupToday(
    organizationId: string,
    today: Date,
  ): Promise<{ id: string; loadNumber: string }[]>;
}
