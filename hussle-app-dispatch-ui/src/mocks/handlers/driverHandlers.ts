import { http, HttpResponse } from 'msw';
import { BASE, defaultMeta } from '../mockUtils';
import { mockDrivers } from '../fixtures/drivers';

type DriverRecord = (typeof mockDrivers)[number];
let db: DriverRecord[] = [...mockDrivers];

export const driverHandlers = [
  http.get(`${BASE}/drivers`, () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get(`${BASE}/drivers/:id`, ({ params }) => {
    const driver = db.find((d) => d.id === params.id);
    if (!driver) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: driver });
  }),

  http.post(`${BASE}/drivers`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `driver-${Date.now()}`,
      carrierId: null,
      carrier: null,
      carrierName: null,
      firstName: '',
      lastName: '',
      email: null,
      phone: null,
      licenseType: 'CLASS_D',
      licenseNumber: null,
      licenseState: null,
      licenseExpiry: null,
      endorsements: null,
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
    } as DriverRecord;
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch(`${BASE}/drivers/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const index = db.findIndex((d) => d.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete(`${BASE}/drivers/:id`, ({ params }) => {
    db = db.filter((d) => d.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
