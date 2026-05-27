import { http, HttpResponse } from 'msw';
import { BASE } from '../mockUtils';
import { mockLoginResponse, mockMeResponse, mockUser } from '../fixtures/auth';

export const authHandlers = [
  http.post(`${BASE}/auth/login`, () => HttpResponse.json(mockLoginResponse)),

  http.post(`${BASE}/auth/signup`, () =>
    HttpResponse.json({ message: 'Signup successful', user: mockUser }),
  ),

  http.get(`${BASE}/auth/me`, () => HttpResponse.json(mockMeResponse)),

  http.post(`${BASE}/auth/token/refresh`, () =>
    HttpResponse.json({ message: 'Token refreshed successfully' }),
  ),

  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 200 })),

  http.post(`${BASE}/auth/switch-org`, () =>
    HttpResponse.json({ message: 'success', user: mockUser, accessibleOrgs: [] }),
  ),

  // ---------------------------------------------------------------------------
  // Batch 3: Auth gaps
  // ---------------------------------------------------------------------------
  http.post(`${BASE}/auth/signup/confirm`, () =>
    HttpResponse.json({ message: 'User confirmed successfully' }),
  ),

  http.post(`${BASE}/auth/signup/resend-code`, () =>
    HttpResponse.json({ message: 'Confirmation code resent' }),
  ),

  http.post(`${BASE}/auth/signup/challenge`, () =>
    HttpResponse.json({ message: 'Challenge completed', session: 'mock-session' }),
  ),

  http.post(`${BASE}/auth/password/reset`, () =>
    HttpResponse.json({ message: 'Password reset code sent' }),
  ),

  http.post(`${BASE}/auth/password/reset/confirm`, () =>
    HttpResponse.json({ message: 'Password reset successful' }),
  ),
];
