import Decimal from 'decimal.js';
import { randomUUID } from 'node:crypto';
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
    const now = new Date().toISOString();

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
        id: randomUUID(),
        category: 'EXCEPTIONS',
        title: `Load ${load.loadNumber} in EXCEPTION`,
        subtitle: null,
        linkTo: `/loads/${load.id}`,
        severity: 'error',
        createdAt: now,
      });
    }

    for (const invoice of overdueInvoices) {
      items.push({
        id: randomUUID(),
        category: 'OVERDUE_INVOICES',
        title: `Invoice ${invoice.invoiceNumber} past due`,
        subtitle: `Due ${invoice.dueDate.toISOString().split('T')[0]}`,
        linkTo: `/invoices/${invoice.id}`,
        severity: 'error',
        createdAt: now,
      });
    }

    for (const load of loadsWithoutRateCon) {
      items.push({
        id: randomUUID(),
        category: 'MISSING_RATE_CON',
        title: `Load ${load.loadNumber} missing rate con`,
        subtitle: null,
        linkTo: `/loads/${load.id}`,
        severity: 'warning',
        createdAt: now,
      });
    }

    for (const invoice of invoicesMissingBol) {
      items.push({
        id: randomUUID(),
        category: 'MISSING_BOL',
        title: `Invoice ${invoice.invoiceNumber} missing signed BOL`,
        subtitle: null,
        linkTo: `/invoices/${invoice.id}`,
        severity: 'warning',
        createdAt: now,
      });
    }

    for (const carrier of expiringInsurance) {
      items.push({
        id: randomUUID(),
        category: 'EXPIRING_INSURANCE',
        title: `${carrier.name} insurance expiring`,
        subtitle: `Expires ${carrier.insuranceExpiry.toISOString().split('T')[0]}`,
        linkTo: `/carriers/${carrier.id}`,
        severity: 'warning',
        createdAt: now,
      });
    }

    for (const load of bookedPickupToday) {
      items.push({
        id: randomUUID(),
        category: 'UNCONFIRMED_PICKUPS',
        title: `Load ${load.loadNumber} pickup today, still BOOKED`,
        subtitle: null,
        linkTo: `/loads/${load.id}`,
        severity: 'error',
        createdAt: now,
      });
    }

    return items;
  },
});
