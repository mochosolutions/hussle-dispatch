import { LOAD_STATUSES } from '../loadStatuses';

describe('LOAD_STATUSES', () => {
  it('contains all 14 defined statuses', () => {
    expect(LOAD_STATUSES).toHaveLength(14);
  });

  it('contains the operational flow statuses in order', () => {
    expect(LOAD_STATUSES).toEqual([
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
    ]);
  });

  it('includes all terminal statuses', () => {
    expect(LOAD_STATUSES).toContain('PAID');
    expect(LOAD_STATUSES).toContain('CANCELED');
    expect(LOAD_STATUSES).toContain('TONU');
  });
});
