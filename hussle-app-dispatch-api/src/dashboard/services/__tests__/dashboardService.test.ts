import Decimal from 'decimal.js';
import { createDashboardService } from '../dashboardService';
import type { DashboardService } from '../dashboardService';
import type { DashboardQueryPort } from '../../types/dashboardTypes';
import { ROLES } from '../../../config/roles';
import { KANBAN_GROUPS } from '../../../shared/constants/kanbanGroups';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildMockQuery = (): jest.Mocked<DashboardQueryPort> => ({
  countLoadsByStatus: jest.fn().mockResolvedValue(0),
  sumRevenueInDateRange: jest.fn().mockResolvedValue(new Decimal(0)),
  sumDispatchFeesInDateRange: jest.fn().mockResolvedValue(new Decimal(0)),
  sumPartnerSplitInDateRange: jest.fn().mockResolvedValue(new Decimal(0)),
  countOverdueInvoices: jest.fn().mockResolvedValue(0),
  sumOverdueInvoices: jest.fn().mockResolvedValue(new Decimal(0)),
  getLoadsInException: jest.fn().mockResolvedValue([]),
  getOverdueInvoices: jest.fn().mockResolvedValue([]),
  getLoadsWithoutRateCon: jest.fn().mockResolvedValue([]),
  getInvoicesMissingBol: jest.fn().mockResolvedValue([]),
  getCarriersWithExpiringInsurance: jest.fn().mockResolvedValue([]),
  getBookedLoadsWithPickupToday: jest.fn().mockResolvedValue([]),
});

const ORG_ID = 'org-test-1';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createDashboardService', () => {
  let dashboardQuery: jest.Mocked<DashboardQueryPort>;
  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    dashboardQuery = buildMockQuery();
    service = createDashboardService({ dashboardQuery });
  });

  // -------------------------------------------------------------------------
  // getKpis
  // -------------------------------------------------------------------------

  describe('getKpis', () => {
    it('calls countLoadsByStatus for each kanban group', async () => {
      // Arrange
      const kanbanKeys = Object.keys(KANBAN_GROUPS);

      // Act
      await service.getKpis({ organizationId: ORG_ID, role: ROLES.ADMIN });

      // Assert
      expect(dashboardQuery.countLoadsByStatus).toHaveBeenCalledTimes(kanbanKeys.length);

      kanbanKeys.forEach((key) => {
        const group = KANBAN_GROUPS[key as keyof typeof KANBAN_GROUPS];
        expect(dashboardQuery.countLoadsByStatus).toHaveBeenCalledWith(
          ORG_ID,
          [...group.statuses],
        );
      });
    });

    it('returns kanban counts from the query adapter', async () => {
      // Arrange
      dashboardQuery.countLoadsByStatus
        .mockResolvedValueOnce(3)  // NEW
        .mockResolvedValueOnce(5)  // BOOKED
        .mockResolvedValueOnce(12) // ACTIVE
        .mockResolvedValueOnce(7)  // DELIVERED
        .mockResolvedValueOnce(20) // COMPLETE
        .mockResolvedValueOnce(2); // ISSUES

      // Act
      const result = await service.getKpis({ organizationId: ORG_ID, role: ROLES.ADMIN });

      // Assert
      expect(result.kanbanCounts).toEqual({
        NEW: 3,
        BOOKED: 5,
        ACTIVE: 12,
        DELIVERED: 7,
        COMPLETE: 20,
        ISSUES: 2,
      });
    });

    it('calls sumRevenueInDateRange for week and month boundaries', async () => {
      // Act
      await service.getKpis({ organizationId: ORG_ID, role: ROLES.ADMIN });

      // Assert — two calls: week range and month range
      expect(dashboardQuery.sumRevenueInDateRange).toHaveBeenCalledTimes(2);

      const calls = dashboardQuery.sumRevenueInDateRange.mock.calls;
      const weekCall = calls[0]!;
      const monthCall = calls[1]!;

      // Week call: Monday 00:00:00 → Sunday 23:59:59
      expect(weekCall[0]).toBe(ORG_ID);
      const weekStart = weekCall[1] as Date;
      const weekEnd = weekCall[2] as Date;
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(weekStart.getHours()).toBe(0);
      expect(weekEnd.getHours()).toBe(23);
      expect(weekEnd.getMinutes()).toBe(59);

      // Month call: 1st of month → last day of month
      expect(monthCall[0]).toBe(ORG_ID);
      const monthStart = monthCall[1] as Date;
      const monthEnd = monthCall[2] as Date;
      expect(monthStart.getDate()).toBe(1);
      expect(monthStart.getHours()).toBe(0);
      expect(monthEnd.getHours()).toBe(23);
      expect(monthEnd.getMinutes()).toBe(59);
    });

    it('calls countOverdueInvoices and sumOverdueInvoices', async () => {
      // Arrange
      dashboardQuery.countOverdueInvoices.mockResolvedValue(4);
      dashboardQuery.sumOverdueInvoices.mockResolvedValue(new Decimal('12500.50'));

      // Act
      const result = await service.getKpis({ organizationId: ORG_ID, role: ROLES.ADMIN });

      // Assert
      expect(dashboardQuery.countOverdueInvoices).toHaveBeenCalledWith(ORG_ID);
      expect(dashboardQuery.sumOverdueInvoices).toHaveBeenCalledWith(ORG_ID);
      expect(result.overdueInvoices.count).toBe(4);
      expect(result.overdueInvoices.total.equals(new Decimal('12500.50'))).toBe(true);
    });

    it('returns partnerSplitThisMonth for ADMIN role', async () => {
      // Arrange
      dashboardQuery.sumPartnerSplitInDateRange.mockResolvedValue(new Decimal('8000'));

      // Act
      const result = await service.getKpis({ organizationId: ORG_ID, role: ROLES.ADMIN });

      // Assert
      expect(dashboardQuery.sumPartnerSplitInDateRange).toHaveBeenCalledTimes(1);
      expect(dashboardQuery.sumPartnerSplitInDateRange).toHaveBeenCalledWith(
        ORG_ID,
        expect.any(Date),
        expect.any(Date),
      );
      expect(result.revenue.partnerSplitThisMonth).not.toBeNull();
      expect(result.revenue.partnerSplitThisMonth?.equals(new Decimal('8000'))).toBe(true);
    });

    it('returns null partnerSplitThisMonth for DISPATCHER role', async () => {
      // Act
      const result = await service.getKpis({ organizationId: ORG_ID, role: ROLES.DISPATCHER });

      // Assert
      expect(dashboardQuery.sumPartnerSplitInDateRange).not.toHaveBeenCalled();
      expect(result.revenue.partnerSplitThisMonth).toBeNull();
    });

    it('handles zero counts and zero revenue gracefully', async () => {
      // Arrange — all mocks default to 0 / Decimal(0)

      // Act
      const result = await service.getKpis({ organizationId: ORG_ID, role: ROLES.ADMIN });

      // Assert
      expect(result.kanbanCounts).toEqual({
        NEW: 0,
        BOOKED: 0,
        ACTIVE: 0,
        DELIVERED: 0,
        COMPLETE: 0,
        ISSUES: 0,
      });
      expect(result.revenue.revenueThisWeek.equals(new Decimal(0))).toBe(true);
      expect(result.revenue.revenueThisMonth.equals(new Decimal(0))).toBe(true);
      expect(result.revenue.dispatchFeesThisMonth.equals(new Decimal(0))).toBe(true);
      expect(result.overdueInvoices.count).toBe(0);
      expect(result.overdueInvoices.total.equals(new Decimal(0))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // getAttentionItems
  // -------------------------------------------------------------------------

  describe('getAttentionItems', () => {
    it('returns items for each attention category with correct severity and linkTo', async () => {
      // Arrange
      dashboardQuery.getLoadsInException.mockResolvedValue([
        { id: 'load-ex-1', loadNumber: 'LD-100' },
      ]);
      dashboardQuery.getOverdueInvoices.mockResolvedValue([
        { id: 'inv-1', invoiceNumber: 'INV-200', dueDate: new Date('2026-03-01') },
      ]);
      dashboardQuery.getLoadsWithoutRateCon.mockResolvedValue([
        { id: 'load-rc-1', loadNumber: 'LD-300' },
      ]);
      dashboardQuery.getInvoicesMissingBol.mockResolvedValue([
        { id: 'inv-bol-1', invoiceNumber: 'INV-400' },
      ]);
      dashboardQuery.getCarriersWithExpiringInsurance.mockResolvedValue([
        { id: 'carrier-1', name: 'Acme Trucking', insuranceExpiry: new Date('2026-04-15') },
      ]);
      dashboardQuery.getBookedLoadsWithPickupToday.mockResolvedValue([
        { id: 'load-pu-1', loadNumber: 'LD-500' },
      ]);

      // Act
      const items = await service.getAttentionItems({ organizationId: ORG_ID });

      // Assert — 6 items total, one per category
      expect(items).toHaveLength(6);

      const exceptions = items.find((i) => i.category === 'EXCEPTIONS');
      expect(exceptions).toBeDefined();
      expect(exceptions?.severity).toBe('error');
      expect(exceptions?.linkTo).toBe('/loads/load-ex-1');
      expect(exceptions?.title).toContain('LD-100');

      const overdue = items.find((i) => i.category === 'OVERDUE_INVOICES');
      expect(overdue).toBeDefined();
      expect(overdue?.severity).toBe('error');
      expect(overdue?.linkTo).toBe('/invoices/inv-1');
      expect(overdue?.subtitle).toContain('2026-03-01');

      const missingRateCon = items.find((i) => i.category === 'MISSING_RATE_CON');
      expect(missingRateCon).toBeDefined();
      expect(missingRateCon?.severity).toBe('warning');
      expect(missingRateCon?.linkTo).toBe('/loads/load-rc-1');

      const missingBol = items.find((i) => i.category === 'MISSING_BOL');
      expect(missingBol).toBeDefined();
      expect(missingBol?.severity).toBe('warning');
      expect(missingBol?.linkTo).toBe('/invoices/inv-bol-1');

      const expiringInsurance = items.find((i) => i.category === 'EXPIRING_INSURANCE');
      expect(expiringInsurance).toBeDefined();
      expect(expiringInsurance?.severity).toBe('warning');
      expect(expiringInsurance?.linkTo).toBe('/carriers/carrier-1');
      expect(expiringInsurance?.title).toContain('Acme Trucking');
      expect(expiringInsurance?.subtitle).toContain('2026-04-15');

      const unconfirmedPickups = items.find((i) => i.category === 'UNCONFIRMED_PICKUPS');
      expect(unconfirmedPickups).toBeDefined();
      expect(unconfirmedPickups?.severity).toBe('error');
      expect(unconfirmedPickups?.linkTo).toBe('/loads/load-pu-1');
    });

    it('returns empty array when all query results are empty', async () => {
      // Arrange — all mocks default to empty arrays

      // Act
      const items = await service.getAttentionItems({ organizationId: ORG_ID });

      // Assert
      expect(items).toEqual([]);
    });

    it('assigns unique ids to each attention item', async () => {
      // Arrange
      dashboardQuery.getLoadsInException.mockResolvedValue([
        { id: 'load-1', loadNumber: 'LD-001' },
        { id: 'load-2', loadNumber: 'LD-002' },
      ]);

      // Act
      const items = await service.getAttentionItems({ organizationId: ORG_ID });

      // Assert
      expect(items).toHaveLength(2);
      expect(items[0]!.id).not.toBe(items[1]!.id);
      expect(items[0]!.id).toBeTruthy();
      expect(items[1]!.id).toBeTruthy();
    });

    it('passes withinDays=30 to getCarriersWithExpiringInsurance', async () => {
      // Act
      await service.getAttentionItems({ organizationId: ORG_ID });

      // Assert
      expect(dashboardQuery.getCarriersWithExpiringInsurance).toHaveBeenCalledWith(ORG_ID, 30);
    });
  });
});
