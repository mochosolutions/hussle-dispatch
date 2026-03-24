import type { Stop } from '@prisma/client';

export interface StopResponse {
  id: string;
  loadId: string;
  contactId: string | null;
  placeId: string | null;
  type: string;
  sequence: number;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentNumber: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toStopResponse = (stop: Stop): StopResponse => ({
  id: stop.id,
  loadId: stop.loadId,
  contactId: stop.contactId,
  placeId: stop.placeId,
  type: stop.type,
  sequence: stop.sequence,
  facilityName: stop.facilityName,
  address: stop.address,
  city: stop.city,
  state: stop.state,
  zip: stop.zip,
  appointmentDate: stop.appointmentDate?.toISOString() ?? null,
  appointmentTime: stop.appointmentTime,
  appointmentNumber: stop.appointmentNumber,
  arrivalTime: stop.arrivalTime?.toISOString() ?? null,
  departureTime: stop.departureTime?.toISOString() ?? null,
  contactName: stop.contactName,
  contactPhone: stop.contactPhone,
  notes: stop.notes,
  createdAt: stop.createdAt.toISOString(),
  updatedAt: stop.updatedAt.toISOString(),
});

export const toStopListResponse = (stops: Stop[]): StopResponse[] =>
  stops.map(toStopResponse);
