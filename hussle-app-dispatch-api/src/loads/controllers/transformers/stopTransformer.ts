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
  schedulingType: string;
  appointmentStart: string | null;
  appointmentEnd: string | null;
  targetDate: string | null;
  notificationHours: number | null;
  notifiedAt: string | null;
  appointmentNumber: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
  contactName: string | null;
  contactPhone: string | null;
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean;
  isTarp: boolean;
  isTempControlled: boolean;
  notes: string | null;
  facilityOpenTime: string | null;
  facilityCloseTime: string | null;
  callByTime: string | null;
  trailerNumber: string | null;
  yardLocation: string | null;
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
  schedulingType: stop.schedulingType,
  appointmentStart: stop.appointmentStart?.toISOString() ?? null,
  appointmentEnd: stop.appointmentEnd?.toISOString() ?? null,
  targetDate: stop.targetDate?.toISOString() ?? null,
  notificationHours: stop.notificationHours,
  notifiedAt: stop.notifiedAt?.toISOString() ?? null,
  appointmentNumber: stop.appointmentNumber,
  arrivalTime: stop.arrivalTime?.toISOString() ?? null,
  departureTime: stop.departureTime?.toISOString() ?? null,
  contactName: stop.contactName,
  contactPhone: stop.contactPhone,
  commodity: stop.commodity,
  weight: stop.weight,
  pieceCount: stop.pieceCount,
  isHazmat: stop.isHazmat,
  isTarp: stop.isTarp,
  isTempControlled: stop.isTempControlled,
  notes: stop.notes,
  facilityOpenTime: stop.facilityOpenTime,
  facilityCloseTime: stop.facilityCloseTime,
  callByTime: stop.callByTime,
  trailerNumber: stop.trailerNumber,
  yardLocation: stop.yardLocation,
  createdAt: stop.createdAt.toISOString(),
  updatedAt: stop.updatedAt.toISOString(),
});

export const toStopListResponse = (stops: Stop[]): StopResponse[] =>
  stops.map(toStopResponse);
