import { http, HttpResponse } from 'msw';
import type { Customer } from 'features/customer/types';
import { BASE, defaultMeta } from '../mockUtils';
import { mockCustomers } from '../fixtures/customers';

let db: Customer[] = [...mockCustomers];

export const customerHandlers = [
  http.get(`${BASE}/customers`, () =>
    HttpResponse.json({ data: db, meta: defaultMeta(db.length) }),
  ),

  http.get(`${BASE}/customers/:id`, ({ params }) => {
    const customer = db.find((c) => c.id === params.id);
    if (!customer) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: customer });
  }),

  http.post(`${BASE}/customers`, async ({ request }) => {
    const body = (await request.json()) as Partial<Customer>;
    const created: Customer = {
      id: `customer-${Date.now()}`,
      organizationId: 'org-001',
      type: 'BROKER',
      companyName: '',
      mcNumber: null,
      dotNumber: null,
      phone: null,
      email: null,
      website: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      paymentTerms: 'net_30',
      paymentTermsDays: 30,
      quickPayDiscount: null,
      notes: null,
      status: 'ACTIVE',
      loadCount: 0,
      contactCount: 0,
      placeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch(`${BASE}/customers/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Customer>;
    const index = db.findIndex((c) => c.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete(`${BASE}/customers/:id`, ({ params }) => {
    db = db.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
