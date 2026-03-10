import { http, HttpResponse } from 'msw';
import type { Vehicle } from 'features/carrier/types';
import { mockVehicles } from '../fixtures/vehicles';

let db: Vehicle[] = [...mockVehicles];

const defaultMeta = (total: number) => ({
  page: 1,
  limit: 20,
  total,
  totalPages: Math.ceil(total / 20),
  hasMore: false,
});

export const vehicleHandlers = [
  http.get('/vehicles', () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get('/vehicles/:id', ({ params }) => {
    const vehicle = db.find((v) => v.id === params.id);
    if (!vehicle) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: vehicle });
  }),

  http.post('/vehicles', async ({ request }) => {
    const body = (await request.json()) as Partial<Vehicle>;
    const created: Vehicle = {
      id: `vehicle-${Date.now()}`,
      carrierId: null,
      driverId: null,
      unitNumber: '',
      make: null,
      model: null,
      year: null,
      vin: null,
      licensePlate: null,
      licensePlateState: null,
      type: 'DRY_VAN',
      ownership: 'OWNED',
      isActive: true,
      emergencyContactName: null,
      emergencyContactPhone: null,
      warrantyInfo: null,
      monthlyGrossTarget: null,
      monthlyMilesTarget: null,
      workingDaysPerMonth: null,
      expenses: [],
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      ...body,
    };
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch('/vehicles/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Vehicle>;
    const index = db.findIndex((v) => v.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete('/vehicles/:id', ({ params }) => {
    db = db.filter((v) => v.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
