import { http, HttpResponse } from 'msw';
import type { Settings } from 'utils/api/fleet/settingsApi';
import { BASE } from '../mockUtils';
import { mockSettings } from '../fixtures/settings';

let settings: Settings = { ...mockSettings };

export const settingsHandlers = [
  http.get(`${BASE}/settings`, () =>
    HttpResponse.json({ data: settings }),
  ),

  http.put(`${BASE}/settings`, async ({ request }) => {
    const body = (await request.json()) as Partial<Settings>;
    settings = { ...settings, ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: settings });
  }),
];
