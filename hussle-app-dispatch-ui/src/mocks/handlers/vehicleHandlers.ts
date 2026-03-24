import { http, HttpResponse } from 'msw';
import type { Vehicle } from 'features/carrier/types';
import { BASE, defaultMeta } from '../mockUtils';
import { mockVehicles, mockVehicleLoads } from '../fixtures/vehicles';

let db: Vehicle[] = [...mockVehicles];

export const vehicleHandlers = [
  http.get(`${BASE}/vehicles`, () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get(`${BASE}/vehicles/:id`, ({ params }) => {
    const vehicle = db.find((v) => v.id === params.id);
    if (!vehicle) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: vehicle });
  }),

  http.post(`${BASE}/vehicles`, async ({ request }) => {
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

  http.patch(`${BASE}/vehicles/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Vehicle>;
    const index = db.findIndex((v) => v.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete(`${BASE}/vehicles/:id`, ({ params }) => {
    db = db.filter((v) => v.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------------------------------------------------------------------------
  // Batch 2: Assign/unassign driver + load history
  // ---------------------------------------------------------------------------
  http.patch(`${BASE}/vehicles/:id/assign-driver`, async ({ params, request }) => {
    const { driverId } = (await request.json()) as { driverId: string };
    const index = db.findIndex((v) => v.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], driverId, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.patch(`${BASE}/vehicles/:id/unassign-driver`, ({ params }) => {
    const index = db.findIndex((v) => v.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], driverId: null, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.get(`${BASE}/vehicles/:id/loads`, ({ params }) => {
    const vehicle = db.find((v) => v.id === params.id);
    if (!vehicle) return new HttpResponse(null, { status: 404 });
    const loads = mockVehicleLoads[params.id as string] ?? [];
    return HttpResponse.json({ data: loads, meta: defaultMeta(loads.length) });
  }),
];
