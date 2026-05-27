import { http, HttpResponse } from 'msw';
import { BASE, defaultMeta } from '../mockUtils';
import { mockLoadIntelItems, mockFeedStats } from '../fixtures/loadIntel';

type IntelItem = (typeof mockLoadIntelItems)[number];
let db: IntelItem[] = [...mockLoadIntelItems];

export const loadIntelHandlers = [
  // Feed — returns BackendLoadIntelItem[] (loadIntelApi.ts maps to frontend types)
  http.get(`${BASE}/load-intel/feed`, () =>
    HttpResponse.json({
      data: db,
      stats: mockFeedStats,
      meta: { page: 1, limit: 25, total: db.length, hasMore: false },
    }),
  ),

  // Single load intel detail
  http.get(`${BASE}/load-intel/:id`, ({ params }) => {
    const item = db.find((i) => i.loadHash === params.id);
    if (!item) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: item });
  }),

  // Chains for a load
  http.get(`${BASE}/load-intel/:id/chains`, ({ params }) => {
    const item = db.find((i) => i.loadHash === params.id);
    if (!item) return new HttpResponse(null, { status: 404 });

    // Return one mock chain for loads that have a destination in a market
    const chains = [{
      chainScore: 82,
      chainType: '2-step' as const,
      legs: [
        {
          origin: `${item.payload.origin.city}, ${item.payload.origin.state}`,
          destination: `${item.payload.dest.city}, ${item.payload.dest.state}`,
          miles: item.payload.loadedMiles ?? 500,
          rate: item.payload.rate ?? null,
        },
        {
          origin: `${item.payload.dest.city}, ${item.payload.dest.state}`,
          destination: `${item.payload.origin.city}, ${item.payload.origin.state}`,
          miles: item.payload.loadedMiles ?? 500,
          rate: null,
        },
      ],
      roundTripProfitability: 0.85,
      dailyRevenue: 2400,
      weeklyGross: 12000,
    }];

    return HttpResponse.json({ data: chains });
  }),

  // Book load — returns prefill data for create-load form
  http.post(`${BASE}/load-intel/:id/book`, ({ params }) => {
    const item = db.find((i) => i.loadHash === params.id);
    if (!item) return new HttpResponse(null, { status: 404 });

    return HttpResponse.json({
      data: {
        loadId: item.loadHash,
        prefill: {
          originCity: item.payload.origin.city,
          originState: item.payload.origin.state,
          destinationCity: item.payload.dest.city,
          destinationState: item.payload.dest.state,
          rate: item.payload.rate ?? null,
          miles: item.payload.loadedMiles ?? null,
          equipmentType: item.payload.equipmentType,
          brokerName: item.payload.broker?.name ?? null,
          pickupDate: item.payload.pickupDate,
          minBookRate: item.scores[0]?.minBookRate ?? null,
        },
      },
    });
  }),

  // Book chain
  http.post(`${BASE}/load-intel/:id/book-chain`, ({ params }) => {
    const item = db.find((i) => i.loadHash === params.id);
    if (!item) return new HttpResponse(null, { status: 404 });

    return HttpResponse.json({
      data: {
        loadId: item.loadHash,
        outboundPrefill: {
          originCity: item.payload.origin.city,
          originState: item.payload.origin.state,
          destinationCity: item.payload.dest.city,
          destinationState: item.payload.dest.state,
          rate: item.payload.rate ?? null,
          miles: item.payload.loadedMiles ?? null,
          equipmentType: item.payload.equipmentType,
          brokerName: item.payload.broker?.name ?? null,
          pickupDate: item.payload.pickupDate,
          minBookRate: item.scores[0]?.minBookRate ?? null,
        },
        backhaulData: {
          route: `${item.payload.dest.city}, ${item.payload.dest.state} → ${item.payload.origin.city}, ${item.payload.origin.state}`,
          rate: null,
          brokerName: null,
          pickupDate: null,
        },
      },
    });
  }),

  // Dismiss
  http.delete(`${BASE}/load-intel/:id`, ({ params }) => {
    db = db.filter((i) => i.loadHash !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // Manual entry
  http.post(`${BASE}/load-intel/manual`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newItem: IntelItem = {
      loadHash: `intel-manual-${Date.now()}`,
      orgId: 'org-001',
      bestScore: 60,
      createdAt: new Date().toISOString(),
      payload: {
        source: 'Manual',
        origin: { city: (body.originCity as string) ?? '', state: (body.originState as string) ?? '' },
        dest: { city: (body.destinationCity as string) ?? '', state: (body.destinationState as string) ?? '' },
        pickupDate: (body.pickupDate as string) ?? new Date().toISOString(),
        equipmentType: (body.equipmentType as string) ?? 'DV',
        rate: (body.rate as number) ?? undefined,
        loadedMiles: (body.loadedMiles as number) ?? undefined,
        broker: body.brokerName ? { name: body.brokerName as string, mc: '' } : undefined,
      },
      scores: [],
    };
    db.push(newItem);
    return HttpResponse.json({ data: newItem }, { status: 201 });
  }),

  // Backhaul / market data
  http.get(`${BASE}/load-intel/backhaul`, ({ request }) => {
    const url = new URL(request.url);
    const city = url.searchParams.get('city') ?? 'Unknown';
    const state = url.searchParams.get('state') ?? 'XX';

    return HttpResponse.json({
      data: {
        city,
        state,
        score: 72,
        avgRate: 3.85,
        loadCount: 15,
      },
    });
  }),
];
