import { http, HttpResponse } from 'msw';
import { BASE } from '../mockUtils';

export const dashboardHandlers = [
  http.get(`${BASE}/dashboard/kpis`, () =>
    HttpResponse.json({
      data: {
        kanbanCounts: {
          NEW: 1,
          BOOKED: 1,
          ACTIVE: 1,
          DELIVERED: 1,
          COMPLETE: 3,
          ISSUES: 0,
        },
        revenue: {
          revenueThisWeek: '18500.00',
          revenueThisMonth: '52400.00',
          companyMarginThisMonth: '5240.00',
        },
        overdueInvoices: {
          count: 1,
          total: '2800.00',
        },
      },
    }),
  ),

  http.get(`${BASE}/dashboard/attention-items`, () =>
    HttpResponse.json({
      data: [
        {
          id: 'att-1',
          category: 'OVERDUE_INVOICES',
          title: 'Invoice INV-2026-004 past due',
          subtitle: 'Due 02/14/2026',
          linkTo: '/invoices/inv-overdue',
          severity: 'error',
          createdAt: '2026-03-23T00:00:00.000Z',
        },
        {
          id: 'att-2',
          category: 'EXPIRING_INSURANCE',
          title: 'Acme Freight LLC insurance expiring',
          subtitle: 'Expires 04/15/2026',
          linkTo: '/carriers/carrier-001',
          severity: 'warning',
          createdAt: '2026-03-23T00:00:00.000Z',
        },
        {
          id: 'att-3',
          category: 'MISSING_BOL',
          title: 'Load LD-2026-0051 missing signed BOL',
          subtitle: null,
          linkTo: '/loads/load-booked',
          severity: 'warning',
          createdAt: '2026-03-22T00:00:00.000Z',
        },
      ],
    }),
  ),
];
