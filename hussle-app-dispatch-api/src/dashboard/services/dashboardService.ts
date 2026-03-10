import Decimal from 'decimal.js';
import { ROLES } from '../../config/roles';
import { KANBAN_GROUPS } from '../../shared/constants/kanbanGroups';
import type {
  DashboardQueryPort,
  DashboardKpis,
  KanbanCounts,
  AttentionItem,
  GetKpisInput,
  GetAttentionItemsInput,
} from '../types/dashboardTypes';

interface DashboardServiceDeps {
  dashboardQuery: DashboardQueryPort;
}

/**
 * Returns Monday 00:00:00 of the current week.
 */
const getWeekStart = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Returns Sunday 23:59:59.999 of the current week.
 */
const getWeekEnd = (): Date => {
  const monday = getWeekStart();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

/**
 * Returns the 1st of the current month at 00:00:00.
 */
const getMonthStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

/**
 * Returns the last day of the current month at 23:59:59.999.
 */
const getMonthEnd = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

export interface DashboardService {
  getKpis(input: GetKpisInput): Promise<DashboardKpis>;
  getAttentionItems(input: GetAttentionItemsInput): Promise<AttentionItem[]>;
}

export const createDashboardService = (
  deps: DashboardServiceDeps,
): DashboardService => ({
  getKpis: async ({ organizationId, role }) => {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const monthStart = getMonthStart();
    const monthEnd = getMonthEnd();

    // Count loads by kanban group
    const kanbanEntries = Object.entries(KANBAN_GROUPS) as [string, { statuses: readonly string[] }][];
    const kanbanCounts: KanbanCounts = {
      NEW: 0,
      BOOKED: 0,
      ACTIVE: 0,
      DELIVERED: 0,
      COMPLETE: 0,
      ISSUES: 0,
    };

    for (const [key, group] of kanbanEntries) {
      const count = await deps.dashboardQuery.countLoadsByStatus(
        organizationId,
        [...group.statuses],
      );
      kanbanCounts[key as keyof KanbanCounts] = count;
    }

    // Revenue calculations
    const [
      revenueThisWeek,
      revenueThisMonth,
      dispatchFeesThisMonth,
      overdueCount,
      overdueTotal,
    ] = await Promise.all([
      deps.dashboardQuery.sumRevenueInDateRange(organizationId, weekStart, weekEnd),
      deps.dashboardQuery.sumRevenueInDateRange(organizationId, monthStart, monthEnd),
      deps.dashboardQuery.sumDispatchFeesInDateRange(organizationId, monthStart, monthEnd),
      deps.dashboardQuery.countOverdueInvoices(organizationId),
      deps.dashboardQuery.sumOverdueInvoices(organizationId),
    ]);

    // Partner split is ADMIN only
    let partnerSplitThisMonth: Decimal | null = null;

    if (role === ROLES.ADMIN) {
      partnerSplitThisMonth = await deps.dashboardQuery.sumPartnerSplitInDateRange(
        organizationId,
        monthStart,
        monthEnd,
      );
    }

    return {
      kanbanCounts,
      revenue: {
        revenueThisWeek,
        revenueThisMonth,
        dispatchFeesThisMonth,
        partnerSplitThisMonth,
      },
      overdueInvoices: {
        count: overdueCount,
        total: overdueTotal,
      },
    };
  },

  getAttentionItems: async ({ organizationId }) => {
    const items: AttentionItem[] = [];

    const [
      exceptionsLoads,
      overdueInvoices,
      loadsWithoutRateCon,
      invoicesMissingBol,
      expiringInsurance,
      bookedPickupToday,
    ] = await Promise.all([
      deps.dashboardQuery.getLoadsInException(organizationId),
      deps.dashboardQuery.getOverdueInvoices(organizationId),
      deps.dashboardQuery.getLoadsWithoutRateCon(organizationId),
      deps.dashboardQuery.getInvoicesMissingBol(organizationId),
      deps.dashboardQuery.getCarriersWithExpiringInsurance(organizationId, 30),
      deps.dashboardQuery.getBookedLoadsWithPickupToday(organizationId, new Date()),
    ]);

    for (const load of exceptionsLoads) {
      items.push({
        type: 'LOAD_EXCEPTION',
        severity: 'critical',
        message: `Load ${load.loadNumber} is in EXCEPTION status`,
        entityId: load.id,
        entityType: 'load',
      });
    }

    for (const invoice of overdueInvoices) {
      items.push({
        type: 'INVOICE_OVERDUE',
        severity: 'critical',
        message: `Invoice ${invoice.invoiceNumber} is past due (${invoice.dueDate.toISOString().split('T')[0]})`,
        entityId: invoice.id,
        entityType: 'invoice',
      });
    }

    for (const load of loadsWithoutRateCon) {
      items.push({
        type: 'MISSING_RATE_CON',
        severity: 'warning',
        message: `Load ${load.loadNumber} is missing rate confirmation`,
        entityId: load.id,
        entityType: 'load',
      });
    }

    for (const invoice of invoicesMissingBol) {
      items.push({
        type: 'MISSING_BOL',
        severity: 'warning',
        message: `Invoice ${invoice.invoiceNumber} is missing signed BOL`,
        entityId: invoice.id,
        entityType: 'invoice',
      });
    }

    for (const carrier of expiringInsurance) {
      items.push({
        type: 'INSURANCE_EXPIRING',
        severity: 'warning',
        message: `${carrier.name} insurance expires ${carrier.insuranceExpiry.toISOString().split('T')[0]}`,
        entityId: carrier.id,
        entityType: 'carrier',
      });
    }

    for (const load of bookedPickupToday) {
      items.push({
        type: 'PICKUP_TODAY_NOT_DISPATCHED',
        severity: 'critical',
        message: `Load ${load.loadNumber} has pickup today but is still in BOOKED status`,
        entityId: load.id,
        entityType: 'load',
      });
    }

    return items;
  },
});
