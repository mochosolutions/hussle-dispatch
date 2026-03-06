import { http, HttpResponse } from 'msw';
import type { CarrierListItem } from 'features/carrier/types';
import { mockCarriers, mockOnboardingStatuses } from '../fixtures/carriers';

let db: CarrierListItem[] = [...mockCarriers];

const defaultMeta = (total: number) => ({
  page: 1,
  limit: 20,
  total,
  totalPages: Math.ceil(total / 20),
  hasMore: false,
});

export const carrierHandlers = [
  http.get('/carriers', () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get('/carriers/:id', ({ params }) => {
    const carrier = db.find((c) => c.id === params.id);
    if (!carrier) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: carrier });
  }),

  http.post('/carriers', async ({ request }) => {
    const body = (await request.json()) as Partial<CarrierListItem>;
    const created: CarrierListItem = {
      id: `carrier-${Date.now()}`,
      name: '',
      type: 'COMPANY_ASSET',
      mcNumber: null,
      dotNumber: null,
      ein: null,
      phone: null,
      email: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      dispatchFeePercent: '10.00',
      partnerSplitPercent: null,
      feeIncludesAccessorials: false,
      dispatchAgreementOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
      insuranceWarning: null,
      w9OnFile: false,
      carrierPacketOnFile: false,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      driverCount: 0,
      vehicleCount: 0,
      onboardingComplete: false,
      ...body,
    };
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch('/carriers/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<CarrierListItem>;
    const index = db.findIndex((c) => c.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete('/carriers/:id', ({ params }) => {
    db = db.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/carriers/:id/onboarding', ({ params }) => {
    const status = mockOnboardingStatuses[params.id as string];
    if (!status) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: status });
  }),

  http.post('/carriers/with-assets', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `carrier-${Date.now()}`,
      ...body,
      drivers: (body.drivers as unknown[]) ?? [],
      vehicles: (body.vehicles as unknown[]) ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: created }, { status: 201 });
  }),
];
