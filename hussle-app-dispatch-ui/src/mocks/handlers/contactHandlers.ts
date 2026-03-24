import { http, HttpResponse } from 'msw';
import type { Contact } from 'features/carrier/types';
import { BASE, defaultMeta } from '../mockUtils';
import { mockContacts } from '../fixtures/contacts';

let db: Contact[] = [...mockContacts];

export const contactHandlers = [
  http.get(`${BASE}/contacts`, () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get(`${BASE}/contacts/:id`, ({ params }) => {
    const contact = db.find((c) => c.id === params.id);
    if (!contact) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: contact });
  }),

  http.post(`${BASE}/contacts`, async ({ request }) => {
    const body = (await request.json()) as Partial<Contact>;
    const created: Contact = {
      id: `contact-${Date.now()}`,
      organizationId: 'org-001',
      firstName: '',
      lastName: '',
      customerId: null,
      role: null,
      email: null,
      phone: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      ...body,
    };
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch(`${BASE}/contacts/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Contact>;
    const index = db.findIndex((c) => c.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete(`${BASE}/contacts/:id`, ({ params }) => {
    db = db.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
