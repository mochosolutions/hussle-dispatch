import type { Place } from '@prisma/client';
import type { Logger } from '@/shared/utils/logger';
import type {
  GeocodeResult,
  GeocodingProviderPort,
} from '@/shared/providers/awsLocationProviderTypes';
import { ACCEPTED_GEOCODE_TYPES } from '@/shared/providers/awsLocationProviderTypes';
import type {
  CreatePlaceInput,
  DedupeKeyParams,
  PlaceRepositoryPort,
  UpdatePlaceInput,
} from '../types/placeTypes';

export const StopResolutionStatus = {
  RESOLVED: 'RESOLVED',
  UNRESOLVED: 'UNRESOLVED',
  AMBIGUOUS: 'AMBIGUOUS',
} as const;
export type StopResolutionStatusValue =
  (typeof StopResolutionStatus)[keyof typeof StopResolutionStatus];

export const WarningCode = {
  STOP_NOT_GEOCODED: 'STOP_NOT_GEOCODED',
  STOP_AMBIGUOUS_ADDRESS: 'STOP_AMBIGUOUS_ADDRESS',
  STOP_PARTIAL_ADDRESS: 'STOP_PARTIAL_ADDRESS',
  GEOCODER_UNAVAILABLE: 'GEOCODER_UNAVAILABLE',
} as const;
export type WarningCodeValue = (typeof WarningCode)[keyof typeof WarningCode];

export interface Warning {
  code: WarningCodeValue;
  stopSequence: number;
  message: string;
}

export interface ResolveStopInput {
  placeId?: string | null;
  facilityName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  sequence: number;
}

export interface ResolveStopResult {
  placeId: string | null;
  resolutionStatus: StopResolutionStatusValue;
  warning: Warning | null;
  facilityNameToWrite?: string;
}

interface ResolveStopToPlaceDeps {
  placeRepo: PlaceRepositoryPort;
  geocodingProvider: GeocodingProviderPort;
  logger: Logger;
}

const MIN_MATCH_SCORE = 0.7;

const ZIP5_REGEX = /\b(\d{5})\b/;

const trimToNullable = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeZip5Local = (zip: string | null | undefined): string | null => {
  if (zip === undefined || zip === null) {
    return null;
  }
  const digits = zip.replace(/[^0-9]/g, '').slice(0, 5);
  return digits.length === 5 ? digits : null;
};

const hasStreetLevelInput = (stop: ResolveStopInput): boolean => {
  const address = trimToNullable(stop.address);
  const city = trimToNullable(stop.city);
  const state = trimToNullable(stop.state);
  return address !== null && city !== null && state !== null;
};

const buildUserDedupeKey = (
  stop: ResolveStopInput,
  organizationId: string,
): DedupeKeyParams => ({
  organizationId,
  name: trimToNullable(stop.facilityName) ?? '',
  awsAddressNumber: null,
  awsStreetBaseName: null,
  awsStreetType: null,
  awsStreetPrefix: null,
  unit: null,
  awsRegion: trimToNullable(stop.state),
  awsPostalCode5: normalizeZip5Local(stop.zip),
});

const buildAwsDedupeKey = (
  stop: ResolveStopInput,
  geocode: GeocodeResult,
  organizationId: string,
): DedupeKeyParams => ({
  organizationId,
  name: trimToNullable(stop.facilityName) ?? geocode.title ?? '',
  awsAddressNumber: geocode.addressNumber,
  awsStreetBaseName: geocode.streetBaseName,
  awsStreetType: geocode.streetType,
  awsStreetPrefix: geocode.streetPrefix,
  unit: geocode.unit,
  awsRegion: geocode.region.length > 0 ? geocode.region : null,
  awsPostalCode5: geocode.postalCode5.length > 0 ? geocode.postalCode5 : null,
});

const hasMinimumKeyParts = (key: DedupeKeyParams): boolean => {
  if (key.name.length > 0) {
    return true;
  }
  return key.awsRegion !== null && key.awsPostalCode5 !== null;
};

const composeFallbackName = (
  stop: ResolveStopInput,
  geocode: GeocodeResult,
): string => {
  const facility = trimToNullable(stop.facilityName);
  if (facility !== null) {
    return facility;
  }
  if (geocode.title !== null && geocode.title.length > 0) {
    return geocode.title;
  }
  // Compose from raw stop fields. Skip null parts gracefully so we never
  // emit dangling commas or "undefined" fragments.
  const stopAddress = trimToNullable(stop.address);
  const stopCity = trimToNullable(stop.city);
  const stopState = trimToNullable(stop.state);
  const stopZip = normalizeZip5Local(stop.zip);

  const cityState =
    stopCity !== null && stopState !== null
      ? `${stopCity}, ${stopState}${stopZip !== null ? ` ${stopZip}` : ''}`
      : stopCity ?? stopState ?? '';

  if (stopAddress !== null && cityState.length > 0) {
    return `${stopAddress}, ${cityState}`;
  }
  if (stopAddress !== null) {
    return stopAddress;
  }
  if (cityState.length > 0) {
    return cityState;
  }
  return 'Unknown Location';
};

const buildCreateInput = (
  stop: ResolveStopInput,
  geocode: GeocodeResult,
  name: string,
  organizationId: string,
): { input: CreatePlaceInput; organizationId: string } => {
  const zipFromGeocode = geocode.postalCode5.length > 0 ? geocode.postalCode5 : null;
  const zip = zipFromGeocode ?? normalizeZip5Local(stop.zip) ?? undefined;

  const inferredZip5FromStop = (() => {
    const raw = trimToNullable(stop.zip);
    if (raw === null) return null;
    const match = raw.match(ZIP5_REGEX);
    return match?.[1] ?? null;
  })();

  return {
    organizationId,
    input: {
      name,
      address: trimToNullable(stop.address) ?? undefined,
      city: geocode.city.length > 0 ? geocode.city : trimToNullable(stop.city) ?? '',
      state: geocode.region.length > 0 ? geocode.region : trimToNullable(stop.state) ?? '',
      zip,
      unit: geocode.unit,
      source: 'AUTO',
      awsAddressNumber: geocode.addressNumber,
      awsStreetBaseName: geocode.streetBaseName,
      awsStreetType: geocode.streetType,
      awsStreetPrefix: geocode.streetPrefix,
      awsRegion: geocode.region.length > 0 ? geocode.region : null,
      awsPostalCode5: zipFromGeocode ?? inferredZip5FromStop,
      latitude: geocode.lat,
      longitude: geocode.lng,
      contactName: trimToNullable(stop.contactName) ?? undefined,
      contactPhone: trimToNullable(stop.contactPhone) ?? undefined,
      notes: trimToNullable(stop.notes) ?? undefined,
    },
  };
};

const softFill = async (
  placeRepo: PlaceRepositoryPort,
  place: Place,
  stop: ResolveStopInput,
): Promise<void> => {
  const updates: UpdatePlaceInput = {};
  let hasUpdate = false;

  const stopContactName = trimToNullable(stop.contactName);
  if (place.contactName === null && stopContactName !== null) {
    updates.contactName = stopContactName;
    hasUpdate = true;
  }
  const stopContactPhone = trimToNullable(stop.contactPhone);
  if (place.contactPhone === null && stopContactPhone !== null) {
    updates.contactPhone = stopContactPhone;
    hasUpdate = true;
  }
  const stopNotes = trimToNullable(stop.notes);
  if (place.notes === null && stopNotes !== null) {
    updates.notes = stopNotes;
    hasUpdate = true;
  }

  if (hasUpdate) {
    await placeRepo.update(place.id, updates);
  }
};

export const createResolveStopToPlace =
  (deps: ResolveStopToPlaceDeps) =>
  async (
    stop: ResolveStopInput,
    organizationId: string,
  ): Promise<ResolveStopResult> => {
    // 1. Explicit placeId — bypass resolution entirely.
    if (stop.placeId !== undefined && stop.placeId !== null && stop.placeId.length > 0) {
      return {
        placeId: stop.placeId,
        resolutionStatus: StopResolutionStatus.RESOLVED,
        warning: null,
      };
    }

    // 2. Tier-1 dedupe — raw user input.
    const userKey = buildUserDedupeKey(stop, organizationId);
    if (hasMinimumKeyParts(userKey)) {
      const userMatch = await deps.placeRepo.findByDedupeKey(userKey);
      if (userMatch !== null) {
        await softFill(deps.placeRepo, userMatch, stop);
        return {
          placeId: userMatch.id,
          resolutionStatus: StopResolutionStatus.RESOLVED,
          warning: null,
          facilityNameToWrite: trimToNullable(stop.facilityName) ?? userMatch.name,
        };
      }
    }

    // 3. Partial-address gate.
    if (!hasStreetLevelInput(stop)) {
      return {
        placeId: null,
        resolutionStatus: StopResolutionStatus.UNRESOLVED,
        warning: {
          code: WarningCode.STOP_PARTIAL_ADDRESS,
          stopSequence: stop.sequence,
          message: 'Address is incomplete — needs street, city, and state.',
        },
      };
    }

    // 4. Call AWS Geocode.
    let geocode: GeocodeResult | null;
    try {
      geocode = await deps.geocodingProvider.geocode({
        street: trimToNullable(stop.address) ?? undefined,
        city: trimToNullable(stop.city) ?? '',
        region: trimToNullable(stop.state) ?? '',
        postalCode: trimToNullable(stop.zip) ?? undefined,
      });
    } catch (error: unknown) {
      deps.logger.warn('geocode failed', {
        sequence: stop.sequence,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        placeId: null,
        resolutionStatus: StopResolutionStatus.UNRESOLVED,
        warning: {
          code: WarningCode.GEOCODER_UNAVAILABLE,
          stopSequence: stop.sequence,
          message:
            'Geocoder is temporarily unavailable. Address could not be resolved.',
        },
      };
    }

    // 5. Type gate.
    if (geocode === null || !ACCEPTED_GEOCODE_TYPES.has(geocode.type)) {
      return {
        placeId: null,
        resolutionStatus: StopResolutionStatus.UNRESOLVED,
        warning: {
          code: WarningCode.STOP_NOT_GEOCODED,
          stopSequence: stop.sequence,
          message: 'Address could not be geocoded to a specific location.',
        },
      };
    }

    // 6. Score gate.
    if (geocode.matchScore < MIN_MATCH_SCORE) {
      return {
        placeId: null,
        resolutionStatus: StopResolutionStatus.AMBIGUOUS,
        warning: {
          code: WarningCode.STOP_AMBIGUOUS_ADDRESS,
          stopSequence: stop.sequence,
          message:
            'Address is ambiguous — please verify spelling and try again.',
        },
      };
    }

    // 7. Tier-2 dedupe — AWS-canonical fields.
    const awsKey = buildAwsDedupeKey(stop, geocode, organizationId);
    const awsMatch = await deps.placeRepo.findByDedupeKey(awsKey);
    if (awsMatch !== null) {
      await softFill(deps.placeRepo, awsMatch, stop);
      return {
        placeId: awsMatch.id,
        resolutionStatus: StopResolutionStatus.RESOLVED,
        warning: null,
        facilityNameToWrite: trimToNullable(stop.facilityName) ?? awsMatch.name,
      };
    }

    // 8. Race-safe create.
    const fallbackName = composeFallbackName(stop, geocode);
    const { input: createInput } = buildCreateInput(
      stop,
      geocode,
      fallbackName,
      organizationId,
    );
    const created = await deps.placeRepo.createOnConflictDoNothing(
      organizationId,
      createInput,
      awsKey,
    );

    return {
      placeId: created.id,
      resolutionStatus: StopResolutionStatus.RESOLVED,
      warning: null,
      facilityNameToWrite: trimToNullable(stop.facilityName) ?? created.name,
    };
  };
