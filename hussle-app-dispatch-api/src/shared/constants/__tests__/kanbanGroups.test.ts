import { KANBAN_GROUPS } from '../kanbanGroups';
import type { LoadStatus } from '../loadStatuses';

describe('KANBAN_GROUPS', () => {
  it('NEW group has yellow color and QUOTED status', () => {
    expect(KANBAN_GROUPS.NEW.color).toBe('yellow');
    expect(KANBAN_GROUPS.NEW.statuses).toContain('QUOTED');
    expect(KANBAN_GROUPS.NEW.statuses).toHaveLength(1);
  });

  it('BOOKED group has orange color and BOOKED status', () => {
    expect(KANBAN_GROUPS.BOOKED.color).toBe('orange');
    expect(KANBAN_GROUPS.BOOKED.statuses).toContain('BOOKED');
    expect(KANBAN_GROUPS.BOOKED.statuses).toHaveLength(1);
  });

  it('ACTIVE group has green color and 5 statuses', () => {
    expect(KANBAN_GROUPS.ACTIVE.color).toBe('green');
    expect(KANBAN_GROUPS.ACTIVE.statuses).toHaveLength(5);
    const expected: LoadStatus[] = [
      'DISPATCHED',
      'EN_ROUTE_PICKUP',
      'AT_PICKUP',
      'IN_TRANSIT',
      'AT_DELIVERY',
    ];
    expected.forEach((s) => expect(KANBAN_GROUPS.ACTIVE.statuses).toContain(s));
  });

  it('DELIVERED group has purple color and 2 statuses', () => {
    expect(KANBAN_GROUPS.DELIVERED.color).toBe('purple');
    expect(KANBAN_GROUPS.DELIVERED.statuses).toHaveLength(2);
    expect(KANBAN_GROUPS.DELIVERED.statuses).toContain('DELIVERED');
    expect(KANBAN_GROUPS.DELIVERED.statuses).toContain('INVOICE_PENDING');
  });

  it('COMPLETE group has gray color and 2 statuses', () => {
    expect(KANBAN_GROUPS.COMPLETE.color).toBe('gray');
    expect(KANBAN_GROUPS.COMPLETE.statuses).toHaveLength(2);
    expect(KANBAN_GROUPS.COMPLETE.statuses).toContain('INVOICED');
    expect(KANBAN_GROUPS.COMPLETE.statuses).toContain('PAID');
  });

  it('ISSUES group has red color and 3 statuses', () => {
    expect(KANBAN_GROUPS.ISSUES.color).toBe('red');
    expect(KANBAN_GROUPS.ISSUES.statuses).toHaveLength(3);
    expect(KANBAN_GROUPS.ISSUES.statuses).toContain('EXCEPTION');
    expect(KANBAN_GROUPS.ISSUES.statuses).toContain('CANCELED');
    expect(KANBAN_GROUPS.ISSUES.statuses).toContain('TONU');
  });

  it('every defined load status appears in exactly one kanban group', () => {
    const allStatuses: LoadStatus[] = [
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
    ];

    const statusToGroups = new Map<LoadStatus, number>();
    allStatuses.forEach((s) => statusToGroups.set(s, 0));

    Object.values(KANBAN_GROUPS).forEach(({ statuses }) => {
      statuses.forEach((s: LoadStatus) => {
        const count = statusToGroups.get(s) ?? 0;
        statusToGroups.set(s, count + 1);
      });
    });

    allStatuses.forEach((s) => {
      expect(statusToGroups.get(s)).toBe(1);
    });
  });
});
