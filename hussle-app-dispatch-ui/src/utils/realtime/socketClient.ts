import { io, type Socket } from 'socket.io-client';
import config from '../../config';

// Names of the domain events the gateway emits into the rooms a client joins.
// Rooms are derived server-side from the session cookie — the client never
// sends room/org/driver identifiers.
export const REALTIME_EVENTS = [
  'load.status.changed',
  'document.confirmed',
  'load.checkcall.logged',
] as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[number];

// Shape shared by every gateway payload — always carries the load it concerns
// plus the scoping identifiers (used by the driver portal to match its load).
export interface RealtimeEventPayload {
  loadId: string;
  organizationId: string;
  driverId?: string | null;
}

// Opens a socket.io connection to the gateway using the session cookie
// (withCredentials). Connection is credentials-based — no auth payload is
// sent from the client. Callers own the returned socket's lifecycle.
export const createRealtimeSocket = (): Socket =>
  io(config.wsUrl, {
    withCredentials: true,
    transports: ['websocket'],
  });
