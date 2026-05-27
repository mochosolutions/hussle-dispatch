import { http, HttpResponse } from 'msw';
import type { CarrierListItem, CarrierNote } from 'features/carrier/types';
import { BASE, defaultMeta } from '../mockUtils';
import { mockCarriers, mockOnboardingStatuses, mockCarrierNotes } from '../fixtures/carriers';

// Wire-level record shape (uses `dispatchFeePercent`, matching the real API).
// The carrierApi client maps to/from the UI domain `companyMarginPercent` at the boundary.
type MockCarrierWire = Omit<Partial<CarrierListItem>, 'companyMarginPercent'> & {
  id: string;
  dispatchFeePercent: string;
};

let db: MockCarrierWire[] = [...mockCarriers];
const notesDb: Record<string, CarrierNote[]> = { ...mockCarrierNotes };

export const carrierHandlers = [
  http.get(`${BASE}/carriers`, () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get(`${BASE}/carriers/:id`, ({ params }) => {
    const carrier = db.find((c) => c.id === params.id);
    if (!carrier) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: carrier });
  }),

  http.post(`${BASE}/carriers`, async ({ request }) => {
    const body = (await request.json()) as Partial<MockCarrierWire>;
    const created = {
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
    } as MockCarrierWire;
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch(`${BASE}/carriers/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<MockCarrierWire>;
    const index = db.findIndex((c) => c.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete(`${BASE}/carriers/:id`, ({ params }) => {
    db = db.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/carriers/:id/onboarding`, ({ params }) => {
    const status = mockOnboardingStatuses[params.id as string];
    if (!status) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: status });
  }),

  http.post(`${BASE}/carriers/with-assets`, async ({ request }) => {
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

  // ---------------------------------------------------------------------------
  // Carrier Notes
  // ---------------------------------------------------------------------------
  http.get(`${BASE}/carriers/:id/notes`, ({ params }) => {
    const carrierId = params.id as string;
    return HttpResponse.json({ data: notesDb[carrierId] ?? [] });
  }),

  http.post(`${BASE}/carriers/:id/notes`, async ({ params, request }) => {
    const carrierId = params.id as string;
    const body = (await request.json()) as { content: string };
    const note: CarrierNote = {
      id: `note-${Date.now()}`,
      carrierId,
      content: body.content,
      authorName: 'Jane Doe',
      createdAt: new Date().toISOString(),
    };
    if (!notesDb[carrierId]) {
      notesDb[carrierId] = [];
    }
    notesDb[carrierId].push(note);
    return HttpResponse.json({ data: note }, { status: 201 });
  }),
];
