import { http, HttpResponse } from 'msw';
import type { Place } from 'features/place/types';
import { BASE, defaultMeta } from '../mockUtils';
import { mockPlaces } from '../fixtures/places';

let db: Place[] = [...mockPlaces];

export const placeHandlers = [
  // List places
  http.get(`${BASE}/places`, () =>
    HttpResponse.json({ data: db, meta: defaultMeta(db.length) }),
  ),

  // Typeahead
  http.get(`${BASE}/places/typeahead`, () => HttpResponse.json({ data: db })),

  // Address search
  http.get(`${BASE}/places/address-search`, ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get('query') ?? '').toLowerCase();

    const saved = db
      .filter((p) => p.name.toLowerCase().includes(query) || p.city.toLowerCase().includes(query))
      .map((p) => ({
        source: 'SAVED' as const,
        id: p.id,
        name: p.name,
        address: p.address ?? '',
        city: p.city,
        state: p.state,
        zip: p.zip ?? '',
        lat: p.latitude,
        lng: p.longitude,
        facilityType: p.facilityType,
        contactName: p.contactName,
        contactPhone: p.contactPhone,
        appointmentRequired: p.appointmentRequired,
        lumperRequired: p.lumperRequired,
        ppeRequired: p.ppeRequired,
      }));

    const external = query.length >= 3
      ? [
          {
            source: 'EXTERNAL' as const,
            id: 'ext-0',
            name: '100 Main St, Memphis, TN 38103',
            address: '100 Main St',
            city: 'Memphis',
            state: 'TN',
            zip: '38103',
            lat: 35.1495,
            lng: -90.049,
            facilityType: null,
            contactName: null,
            contactPhone: null,
            appointmentRequired: false,
            lumperRequired: false,
            ppeRequired: false,
          },
          {
            source: 'EXTERNAL' as const,
            id: 'ext-1',
            name: '500 Commerce St, Nashville, TN 37203',
            address: '500 Commerce St',
            city: 'Nashville',
            state: 'TN',
            zip: '37203',
            lat: 36.1627,
            lng: -86.7816,
            facilityType: null,
            contactName: null,
            contactPhone: null,
            appointmentRequired: false,
            lumperRequired: false,
            ppeRequired: false,
          },
        ]
      : [];

    return HttpResponse.json({ data: [...saved, ...external] });
  }),

  // Route distance
  http.post(`${BASE}/places/route-distance`, () =>
    HttpResponse.json({
      data: {
        totalMiles: 847,
        totalMinutes: 780,
        legs: [
          { distanceMiles: 847, durationMinutes: 780, isEstimated: true },
        ],
        isEstimated: true,
      },
    }),
  ),

  // Place detail
  http.get(`${BASE}/places/:id`, ({ params }) => {
    const place = db.find((p) => p.id === params.id);
    if (!place) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: place });
  }),

  // Create place
  http.post(`${BASE}/places`, async ({ request }) => {
    const body = (await request.json()) as Partial<Place>;
    const created: Place = {
      id: `place-${Date.now()}`,
      name: '',
      facilityType: null,
      dockType: null,
      address: null,
      address2: null,
      city: '',
      state: '',
      zip: null,
      latitude: null,
      longitude: null,
      geoSource: null,
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      operatingHours: null,
      receivingHours: null,
      appointmentRequired: false,
      lumperRequired: false,
      ppeRequired: false,
      checkInProcedures: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      ...body,
    };
    db.push(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  // Update place
  http.patch(`${BASE}/places/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Place>;
    const index = db.findIndex((p) => p.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    db[index] = { ...db[index], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: db[index] });
  }),

  // Delete place
  http.delete(`${BASE}/places/:id`, ({ params }) => {
    db = db.filter((p) => p.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
