import { http, HttpResponse } from 'msw';
import type { Contact } from 'features/carrier/types';
import { mockContacts } from '../fixtures/contacts';

let db: Contact[] = [...mockContacts];

const defaultMeta = (total: number) => ({
  page: 1,
  limit: 20,
  total,
  totalPages: Math.ceil(total / 20),
  hasMore: false,
});

export const contactHandlers = [
  http.get('/contacts', () => HttpResponse.json({ data: db, meta: defaultMeta(db.length) })),

  http.get('/contacts/:id', ({ params }) => {
    const contact = db.find((c) => c.id === params.id);
    if (!contact) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: contact });
  }),

  http.post('/contacts', async ({ request }) => {
    const body = (await request.json()) as Partial<Contact>;
    const created: Contact = {
      id: `contact-${Date.now()}`,
      companyName: '',
      contactName: null,
      type: 'BROKER',
      mcNumber: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      zip: null,
      paymentTerms: 'NET30',
      paymentTermsDays: 30,
      quickPayDiscount: null,
      carrierPacketSentAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      ...body,
    };
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  http.patch('/contacts/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Contact>;
    const index = db.findIndex((c) => c.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  http.delete('/contacts/:id', ({ params }) => {
    db = db.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
