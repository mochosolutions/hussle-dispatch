import type { Logger } from '@/shared/utils/logger';
import { NotFoundError } from '@/shared/errors';
import { isFacilityOpenAt, validateFacilityHoursJson } from '@/shared/utils/facilityHours';
import type { PlaceRepositoryPort } from '../types/placeTypes';

interface CheckFacilityOpenAtInput {
  placeId: string;
  organizationId: string;
  atUtc: Date;
}

interface CheckFacilityOpenAtResult {
  isOpen: boolean;
}

interface FacilityHoursServiceDeps {
  placeRepo: PlaceRepositoryPort;
  logger: Logger;
}

export const checkFacilityOpenAt = async (
  input: CheckFacilityOpenAtInput,
  deps: FacilityHoursServiceDeps,
): Promise<CheckFacilityOpenAtResult> => {
  const place = await deps.placeRepo.findById(input.placeId, input.organizationId);

  if (place === null) {
    throw new NotFoundError('Place not found.');
  }

  if (place.is24Hours) {
    return { isOpen: true };
  }

  if (place.facilityHours === null || place.timezone === null) {
    deps.logger.debug('Place has no facility hours or timezone configured', {
      placeId: input.placeId,
    });
    return { isOpen: false };
  }

  const hours = validateFacilityHoursJson(place.facilityHours);
  const isOpen = isFacilityOpenAt({ hours, facilityIs24Hours: place.is24Hours, timezone: place.timezone, atUtc: input.atUtc });

  return { isOpen };
};

export type { CheckFacilityOpenAtInput, CheckFacilityOpenAtResult, FacilityHoursServiceDeps };
