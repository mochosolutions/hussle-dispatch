import { http, HttpResponse } from 'msw';
import { BASE } from '../mockUtils';
import { allInvoices, invoiceMap, mockInvoice } from '../fixtures/invoices';

export const invoiceHandlers = [
  // List invoices
  http.get(`${BASE}/invoices`, () =>
    HttpResponse.json({
      data: allInvoices,
      meta: { page: 1, limit: 25, total: allInvoices.length, totalPages: 1, hasMore: false },
    }),
  ),

  // Invoice counts
  http.get(`${BASE}/invoices/counts`, () =>
    HttpResponse.json({ data: { draft: allInvoices.filter((inv) => inv.status === 'DRAFT').length } }),
  ),

  // Create from load
  http.post(`${BASE}/invoices/from-load/:loadId`, () =>
    HttpResponse.json({ data: mockInvoice }, { status: 201 }),
  ),

  // Invoice detail
  http.get(`${BASE}/invoices/:id`, ({ params }) => {
    const invoice = invoiceMap[params['id'] as string];
    if (invoice) {
      return HttpResponse.json({ data: invoice });
    }
    return HttpResponse.json({ errors: [{ message: 'Not found' }] }, { status: 404 });
  }),

  // Update invoice
  http.patch(`${BASE}/invoices/:id`, ({ params }) => {
    const invoice = invoiceMap[params['id'] as string];
    return HttpResponse.json({ data: invoice ?? mockInvoice });
  }),

  // Approve invoice
  http.post(`${BASE}/invoices/:id/approve`, ({ params }) => {
    const invoice = invoiceMap[params['id'] as string] ?? mockInvoice;
    return HttpResponse.json({ data: { ...invoice, status: 'APPROVED', approvedAt: new Date().toISOString() } });
  }),

  // Send invoice
  http.post(`${BASE}/invoices/:id/send`, ({ params }) => {
    const invoice = invoiceMap[params['id'] as string] ?? mockInvoice;
    return HttpResponse.json({
      data: { ...invoice, status: 'SENT', sentAt: new Date().toISOString(), sentToEmail: 'test@example.com' },
    });
  }),

  // Void invoice
  http.post(`${BASE}/invoices/:id/void`, ({ params }) => {
    const invoice = invoiceMap[params['id'] as string] ?? mockInvoice;
    return HttpResponse.json({ data: { ...invoice, status: 'VOID' } });
  }),

  // Mark paid
  http.post(`${BASE}/invoices/:id/mark-paid`, ({ params }) => {
    const invoice = invoiceMap[params['id'] as string] ?? mockInvoice;
    return HttpResponse.json({
      data: { ...invoice, status: 'PAID', paidAt: new Date().toISOString(), paidAmount: invoice.totalAmount },
    });
  }),

  // Delete invoice
  http.delete(`${BASE}/invoices/:id`, () => new HttpResponse(null, { status: 204 })),

  // PDF preview
  http.get(`${BASE}/invoices/:id/preview`, () =>
    new HttpResponse(new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' }), {
      headers: { 'Content-Type': 'application/pdf' },
    }),
  ),

  // PDF generate
  http.get(`${BASE}/invoices/:id/pdf`, () =>
    HttpResponse.json({ data: { pdfUrl: 'https://example.com/invoice.pdf' } }),
  ),

  // Document packet
  http.get(`${BASE}/invoices/:id/packet`, () =>
    new HttpResponse(new Blob(['PK dummy zip'], { type: 'application/zip' }), {
      headers: { 'Content-Type': 'application/zip' },
    }),
  ),
];
