import { http, HttpResponse } from 'msw';
import { mockLoginResponse, mockMeResponse, mockUser } from '../fixtures/auth';

export const authHandlers = [
  http.post('/auth/login', () => HttpResponse.json(mockLoginResponse)),

  http.post('/auth/signup', () =>
    HttpResponse.json({ message: 'Signup successful', user: mockUser }),
  ),

  http.get('/auth/me', () => HttpResponse.json(mockMeResponse)),

  http.post('/auth/token/refresh', () =>
    HttpResponse.json({ message: 'Token refreshed successfully' }),
  ),

  http.post('/auth/logout', () => new HttpResponse(null, { status: 200 })),

  http.post('/auth/switch-org', () =>
    HttpResponse.json({ message: 'success', user: mockUser, accessibleOrgs: [] }),
  ),
];
