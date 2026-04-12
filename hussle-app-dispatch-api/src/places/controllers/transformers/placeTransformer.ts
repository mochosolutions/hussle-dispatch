import type { Place } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import type { PlaceResponse } from '../../types/placeTypes';

const decimalToNumber = (value: Decimal | null): number | null => {
  if (value === null) {
    return null;
  }
  return value.toNumber();
};

export const toPlaceResponse = (place: Place): PlaceResponse => ({
  id: place.id,
  organizationId: place.organizationId,
  contactId: place.contactId,
  customerId: place.customerId,
  name: place.name,
  address: place.address,
  address2: place.address2,
  city: place.city,
  state: place.state,
  zip: place.zip,
  latitude: decimalToNumber(place.latitude),
  longitude: decimalToNumber(place.longitude),
  geoSource: place.geoSource,
  facilityType: place.facilityType,
  facilityHours: place.facilityHours,
  is24Hours: place.is24Hours,
  timezone: place.timezone,
  appointmentRequired: place.appointmentRequired,
  dockType: place.dockType,
  contactName: place.contactName,
  contactPhone: place.contactPhone,
  contactEmail: place.contactEmail,
  checkInProcedures: place.checkInProcedures,
  lumperRequired: place.lumperRequired,
  ppeRequired: place.ppeRequired,
  notes: place.notes,
  status: place.status,
  createdAt: place.createdAt.toISOString(),
  updatedAt: place.updatedAt.toISOString(),
  deletedAt: place.deletedAt?.toISOString() ?? null,
});

export const toPlaceListResponse = (places: Place[]): PlaceResponse[] =>
  places.map((place) => toPlaceResponse(place));

export const toPlaceListEnvelope = (
  places: Place[],
  meta: PaginationMeta,
): { data: PlaceResponse[]; meta: PaginationMeta } => ({
  data: toPlaceListResponse(places),
  meta,
});
