import type { DashboardKpis, AttentionItem } from '../../types/dashboardTypes';

interface KpisResponse {
  kanbanCounts: {
    NEW: number;
    BOOKED: number;
    ACTIVE: number;
    DELIVERED: number;
    COMPLETE: number;
    ISSUES: number;
  };
  revenue: {
    revenueThisWeek: string;
    revenueThisMonth: string;
    dispatchFeesThisMonth: string;
    partnerSplitThisMonth: string | null;
  };
  overdueInvoices: {
    count: number;
    total: string;
  };
}

export const toKpisResponse = (kpis: DashboardKpis): KpisResponse => ({
  kanbanCounts: kpis.kanbanCounts,
  revenue: {
    revenueThisWeek: kpis.revenue.revenueThisWeek.toFixed(2),
    revenueThisMonth: kpis.revenue.revenueThisMonth.toFixed(2),
    dispatchFeesThisMonth: kpis.revenue.dispatchFeesThisMonth.toFixed(2),
    partnerSplitThisMonth: kpis.revenue.partnerSplitThisMonth?.toFixed(2) ?? null,
  },
  overdueInvoices: {
    count: kpis.overdueInvoices.count,
    total: kpis.overdueInvoices.total.toFixed(2),
  },
});

interface AttentionItemResponse {
  type: string;
  severity: string;
  message: string;
  entityId: string;
  entityType: string;
}

export const toAttentionItemsResponse = (
  items: AttentionItem[],
): AttentionItemResponse[] =>
  items.map((item) => ({
    type: item.type,
    severity: item.severity,
    message: item.message,
    entityId: item.entityId,
    entityType: item.entityType,
  }));
