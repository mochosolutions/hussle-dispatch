import { http, HttpResponse } from 'msw';
import { BASE } from '../mockUtils';

const mockPortalLoad = {
  id: 'load-intransit',
  loadNumber: 'LD-2026-0054',
  status: 'IN_TRANSIT',
  equipmentType: 'DRY_VAN',
  commodity: 'Electronics',
  weight: 38000,
  driverInstructions: 'Call dispatch when arriving at delivery',
  stops: [
    {
      id: 'stop-p1',
      type: 'PICKUP',
      sequence: 0,
      facilityName: 'Chicago Warehouse',
      address: '123 Industrial Blvd',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      appointmentDate: '2026-03-22',
      appointmentTime: '08:00',
      contactName: 'Mike Johnson',
      contactPhone: '(312) 555-0100',
      notes: null,
    },
    {
      id: 'stop-d1',
      type: 'DELIVERY',
      sequence: 1,
      facilityName: 'Dallas Distribution',
      address: '456 Commerce St',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      appointmentDate: '2026-03-23',
      appointmentTime: '14:00',
      contactName: 'Sarah Williams',
      contactPhone: '(214) 555-0200',
      notes: 'Dock 7',
    },
  ],
  driver: { firstName: 'Carlos', lastName: 'Rivera' },
};

export const driverPortalHandlers = [
  // Send driver link (dispatcher-facing)
  http.post(`${BASE}/driver-portal/loads/:loadId/send-driver-link`, () =>
    HttpResponse.json({ data: { message: 'Driver link sent', token: `mock-token-${Date.now()}` } }),
  ),

  // Public portal: get load summary
  http.get(`${BASE}/driver-portal/portal/load`, () =>
    HttpResponse.json({ data: mockPortalLoad }),
  ),

  // Public portal: advance status
  http.post(`${BASE}/driver-portal/portal/load/status`, async ({ request }) => {
    const body = (await request.json()) as { status: string };
    mockPortalLoad.status = body.status;
    return HttpResponse.json({ data: { success: true, status: body.status } });
  }),

  // Public portal: check-in
  http.post(`${BASE}/driver-portal/portal/load/check-in`, () =>
    HttpResponse.json({ data: { message: 'Check-in recorded' } }),
  ),

  // Public portal: presign document
  http.post(`${BASE}/driver-portal/portal/load/documents/presign`, () => {
    const documentId = `doc-portal-${Date.now()}`;
    return HttpResponse.json({
      data: {
        documentId,
        presignedUrl: `http://localhost:9999/fake-upload/${documentId}`,
        expiresIn: 3600,
      },
    });
  }),

  // Public portal: confirm document
  http.post(`${BASE}/driver-portal/portal/load/documents/:id/confirm`, () =>
    HttpResponse.json({ data: { message: 'Document confirmed' } }),
  ),
];
