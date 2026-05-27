import { http, HttpResponse } from 'msw';
import { BASE, defaultMeta } from '../mockUtils';
import { mockLoads } from '../fixtures/loads';

type LoadRecord = (typeof mockLoads)[number];
let db: LoadRecord[] = [...mockLoads];

const findLoad = (id: string) => db.find((l) => l.id === id);

export const loadHandlers = [
  // List loads
  http.get(`${BASE}/loads`, () =>
    HttpResponse.json({ data: db, meta: defaultMeta(db.length) }),
  ),

  // Weekly gross
  http.get(`${BASE}/loads/weekly-gross`, () =>
    HttpResponse.json({
      data: [
        {
          vehicleId: 'vehicle-001',
          unitNumber: 'TRK-1001',
          driverName: 'Marcus Johnson',
          carrierName: 'Acme Freight LLC',
          revenue: 12500.5,
          target: 15000.0,
          loadCount: 3,
          percent: 83.3,
        },
        {
          vehicleId: 'vehicle-002',
          unitNumber: 'TRK-1002',
          driverName: 'Sarah Mitchell',
          carrierName: 'Acme Freight LLC',
          revenue: 8200.0,
          target: 12000.0,
          loadCount: 2,
          percent: 68.3,
        },
        {
          vehicleId: 'vehicle-003',
          unitNumber: 'TRK-2001',
          driverName: 'James Rivera',
          carrierName: "Mike's Owner Op",
          revenue: 6800.0,
          target: 10000.0,
          loadCount: 2,
          percent: 68.0,
        },
      ],
    }),
  ),

  // Load detail
  http.get(`${BASE}/loads/:id`, ({ params }) => {
    const load = findLoad(params['id'] as string);
    if (load) {
      return HttpResponse.json({ data: load });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Create load
  http.post(`${BASE}/loads`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `load-${Date.now()}`,
      ...body,
      status: 'DRAFT',
      invoiceReadiness: 'NOT_READY',
      stops: [],
      accessorialCharges: [],
      statusHistory: [
        { id: `sh-${Date.now()}`, fromStatus: null, toStatus: 'DRAFT', changedByName: 'Jane Doe', notes: null, createdAt: new Date().toISOString() },
      ],
      checkCalls: [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  // Update load
  http.patch(`${BASE}/loads/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const index = db.findIndex((l) => l.id === params['id']);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() } as LoadRecord;
    return HttpResponse.json({ data: db[index] });
  }),

  // Delete load
  http.delete(`${BASE}/loads/:id`, ({ params }) => {
    db = db.filter((l) => l.id !== params['id']);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------------------------------------------------------------------------
  // Batch 1: Status transition
  // ---------------------------------------------------------------------------
  http.patch(`${BASE}/loads/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { status: string; notes?: string };
    const load = findLoad(params['id'] as string);
    if (!load) return new HttpResponse(null, { status: 404 });

    const previousStatus = load.status;
    load.status = body.status;
    load.updatedAt = new Date().toISOString();
    load.statusHistory = [
      ...load.statusHistory,
      {
        id: `sh-${Date.now()}`,
        fromStatus: previousStatus,
        toStatus: body.status,
        changedByName: 'Jane Doe',
        notes: body.notes ?? null,
        createdAt: new Date().toISOString(),
      },
    ];

    return HttpResponse.json({ success: true, load });
  }),

  // Assignment
  http.patch(`${BASE}/loads/:id/assignment`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const load = findLoad(params['id'] as string);
    if (!load) return new HttpResponse(null, { status: 404 });

    Object.assign(load, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json({ data: load });
  }),

  // Check calls
  http.get(`${BASE}/loads/:id/check-calls`, ({ params }) => {
    const load = findLoad(params['id'] as string);
    if (!load) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: load.checkCalls ?? [] });
  }),

  http.post(`${BASE}/loads/:id/check-calls`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const load = findLoad(params['id'] as string);
    if (!load) return new HttpResponse(null, { status: 404 });

    const checkCall = {
      id: `cc-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };
    load.checkCalls = [...(load.checkCalls ?? []), checkCall];
    return HttpResponse.json({ data: checkCall }, { status: 201 });
  }),

  // Status history
  http.get(`${BASE}/loads/:id/status-history`, ({ params }) => {
    const load = findLoad(params['id'] as string);
    if (!load) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: load.statusHistory });
  }),

  // Load documents
  http.get(`${BASE}/loads/:id/documents`, () =>
    HttpResponse.json({ data: [] }),
  ),
];
