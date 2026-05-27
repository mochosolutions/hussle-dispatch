import { http, HttpResponse } from 'msw';
import { BASE } from '../mockUtils';

// In-memory stores
const customerSettings: Record<string, Array<{
  id: string;
  customerId: string;
  trigger: string;
  channel: string;
  enabled: boolean;
  recipientEmail: string | null;
  recipientPhone: string | null;
  createdAt: string;
  updatedAt: string;
}>> = {
  'customer-001': [
    {
      id: 'ns-001',
      customerId: 'customer-001',
      trigger: 'STATUS_CHANGE',
      channel: 'EMAIL',
      enabled: true,
      recipientEmail: 'dispatch@acmefreight.com',
      recipientPhone: null,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'ns-002',
      customerId: 'customer-001',
      trigger: 'DOCUMENT_UPLOADED',
      channel: 'EMAIL',
      enabled: false,
      recipientEmail: 'dispatch@acmefreight.com',
      recipientPhone: null,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ],
};

export const notificationHandlers = [
  // Customer notification settings
  http.get(`${BASE}/notifications/customers/:customerId/settings`, ({ params }) => {
    const settings = customerSettings[params.customerId as string] ?? [];
    return HttpResponse.json({ data: settings });
  }),

  http.put(`${BASE}/notifications/customers/:customerId/settings`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const customerId = params.customerId as string;
    const setting = {
      id: `ns-${Date.now()}`,
      customerId,
      trigger: body.trigger as string,
      channel: body.channel as string,
      enabled: body.enabled as boolean,
      recipientEmail: (body.recipientEmail as string) ?? null,
      recipientPhone: (body.recipientPhone as string) ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!customerSettings[customerId]) {
      customerSettings[customerId] = [];
    }
    customerSettings[customerId].push(setting);
    return HttpResponse.json({ data: setting });
  }),

  http.put(`${BASE}/notifications/customers/:customerId/settings/bulk`, async ({ params, request }) => {
    const { settings } = (await request.json()) as { settings: Array<Record<string, unknown>> };
    const customerId = params.customerId as string;
    const created = settings.map((s) => ({
      id: `ns-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customerId,
      trigger: s.trigger as string,
      channel: s.channel as string,
      enabled: s.enabled as boolean,
      recipientEmail: (s.recipientEmail as string) ?? null,
      recipientPhone: (s.recipientPhone as string) ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    customerSettings[customerId] = created;
    return HttpResponse.json({ data: created });
  }),

  // Load notification overrides
  http.get(`${BASE}/notifications/loads/:loadId/overrides`, () =>
    HttpResponse.json({ data: [] }),
  ),

  http.put(`${BASE}/notifications/loads/:loadId/overrides`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const override = {
      id: `no-${Date.now()}`,
      loadId: params.loadId as string,
      trigger: body.trigger as string,
      channel: body.channel as string,
      enabled: body.enabled as boolean,
      recipientEmail: (body.recipientEmail as string) ?? null,
      recipientPhone: (body.recipientPhone as string) ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: override });
  }),

  http.put(`${BASE}/notifications/loads/:loadId/overrides/bulk`, async ({ params, request }) => {
    const { overrides } = (await request.json()) as { overrides: Array<Record<string, unknown>> };
    const created = overrides.map((o) => ({
      id: `no-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      loadId: params.loadId as string,
      trigger: o.trigger as string,
      channel: o.channel as string,
      enabled: o.enabled as boolean,
      recipientEmail: (o.recipientEmail as string) ?? null,
      recipientPhone: (o.recipientPhone as string) ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return HttpResponse.json({ data: created });
  }),

  // Notification history
  http.get(`${BASE}/notifications/loads/:loadId/history`, () =>
    HttpResponse.json({ data: [] }),
  ),

  // Tracking token
  http.post(`${BASE}/notifications/loads/:loadId/tracking-token`, ({ params }) =>
    HttpResponse.json({
      data: {
        id: `tt-${Date.now()}`,
        loadId: params.loadId as string,
        token: `mock-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    }),
  ),
];
