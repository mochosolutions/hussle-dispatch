import { http, HttpResponse } from 'msw';
import type { Driver } from 'features/carrier/types';
import { mockDrivers } from '../fixtures/drivers';

let db: Driver[] = [...mockDrivers];

const defaultMeta = (total: number) => ({
  page: 1,
  limit: 20,
  total,
  totalPages: Math.ceil(total / 20),
  hasMore: false,
});

export const driverHandlers = [
  http.get('/drivers', () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get('/drivers/:id', ({ params }) => {
    const driver = db.find((d) => d.id === params.id);
    if (!driver) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: driver });
  }),

  http.post('/drivers', async ({ request }) => {
    const body = (await request.json()) as Partial<Driver>;
    const created: Driver = {
      id: `driver-${Date.now()}`,
      carrierId: null,
      firstName: '',
      lastName: '',
      email: null,
      phone: null,
      cdlNumber: null,
      cdlState: null,
      cdlExpiry: null,
      isAvailable: true,
      status: 'AVAILABLE',
      homeBaseCity: null,
      homeBaseState: null,
      availableHours: null,
      currentCity: null,
      currentState: null,
      maxDaysOut: null,
      preferredLanes: [],
      noGoZones: [],
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      ...body,
    };
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch('/drivers/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Driver>;
    const index = db.findIndex((d) => d.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete('/drivers/:id', ({ params }) => {
    db = db.filter((d) => d.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
