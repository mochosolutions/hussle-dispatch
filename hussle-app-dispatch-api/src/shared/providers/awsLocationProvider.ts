import {
  GeoPlacesClient,
  GeocodeCommand,
  SearchTextCommand,
} from '@aws-sdk/client-geo-places';
import {
  GeoRoutesClient,
  CalculateRoutesCommand,
} from '@aws-sdk/client-geo-routes';
import {
  GeoMapsClient,
  GetTileCommand,
  GetSpritesCommand,
  GetGlyphsCommand,
  GetStyleDescriptorCommand,
} from '@aws-sdk/client-geo-maps';
import { env } from '@/config/env';
import type {
  GeocodeResult,
  GeocodeSuggestion,
  GeocodingProviderPort,
  MapAsset,
  MapStyleDescriptor,
  MapTile,
  MapTileProviderPort,
  RouteDistanceResult,
  RoutingProviderPort,
  StructuredAddressInput,
  TileCoordinates,
} from './awsLocationProviderTypes';
import { normalizeStateCode } from './normalizeStateCode';

const METERS_TO_MILES = 0.000621371;
const SECONDS_PER_MINUTE = 60;
const DEFAULT_BIAS_POSITION: [number, number] = [-98.5, 39.5];
const DEFAULT_TILESET = 'vector.basemap';
const DEFAULT_MAP_STYLE = 'Standard';
const DEFAULT_COLOR_SCHEME = 'Light';
const DEFAULT_VARIANT = 'Default';

const awsCredentials = (): { accessKeyId: string; secretAccessKey: string } | undefined =>
  env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

const createGeoPlacesClient = (): GeoPlacesClient =>
  new GeoPlacesClient({
    region: env.AWS_REGION,
    credentials: awsCredentials(),
  });

const createGeoRoutesClient = (): GeoRoutesClient =>
  new GeoRoutesClient({
    region: env.AWS_REGION,
    credentials: awsCredentials(),
  });

const createGeoMapsClient = (): GeoMapsClient =>
  new GeoMapsClient({
    region: env.AWS_REGION,
    credentials: awsCredentials(),
  });

const normalizeZip5 = (zip: string | undefined): string => {
  if (zip === undefined || zip === null) {
    return '';
  }
  const digits = zip.replace(/[^0-9]/g, '').slice(0, 5);
  return digits.length === 5 ? digits : '';
};

const POI_PLACE_TYPES = new Set<string>(['PointOfInterest']);

interface SearchTextResultItemShape {
  PlaceId?: string;
  PlaceType?: string;
  Title?: string;
  Address?: {
    Label?: string;
    AddressNumber?: string;
    Street?: string;
    Locality?: string;
    Region?: { Code?: string; Name?: string };
    PostalCode?: string;
  };
  Position?: number[];
}

const extractAddressFromLabel = (label: string | undefined): string => {
  if (!label) {
    return '';
  }
  const firstSegment = label.split(',')[0]?.trim() ?? '';
  return firstSegment;
};

const buildAddress = (item: SearchTextResultItemShape): string => {
  const parts = [item.Address?.AddressNumber, item.Address?.Street].filter(
    (p): p is string => Boolean(p),
  );
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return extractAddressFromLabel(item.Address?.Label);
};

const buildState = (item: SearchTextResultItemShape): string => {
  const code = item.Address?.Region?.Code;
  if (code !== undefined && code.length > 0) {
    return normalizeStateCode(code);
  }
  const name = item.Address?.Region?.Name;
  if (name !== undefined && name.length > 0) {
    return normalizeStateCode(name);
  }
  return '';
};

const buildName = (item: SearchTextResultItemShape): string | null => {
  const placeType = item.PlaceType;
  const title = item.Title;
  if (title === undefined || title.length === 0) {
    return null;
  }
  if (placeType !== undefined && POI_PLACE_TYPES.has(placeType)) {
    return title;
  }
  // For non-POI types (PointAddress, Street, Locality, etc.), AWS sets Title
  // to the formatted address — not a useful business name.
  return null;
};

interface GeocodeResultItemShape {
  PlaceType?: string;
  Title?: string;
  MatchScores?: { Overall?: number };
  Address?: {
    AddressNumber?: string;
    Street?: string;
    Locality?: string;
    Region?: { Code?: string; Name?: string };
    PostalCode?: string;
    StreetComponents?: {
      BaseName?: string;
      Type?: string;
      Prefix?: string;
    }[];
    SecondaryAddressComponents?: {
      Number?: string;
      Designator?: string;
    }[];
  };
  Position?: number[];
}

const mapGeocodeItemToResult = (item: GeocodeResultItemShape): GeocodeResult | null => {
  const position = item.Position;
  if (position === undefined || position.length < 2) {
    return null;
  }
  const lng = position[0];
  const lat = position[1];
  if (lng === undefined || lat === undefined) {
    return null;
  }

  const street = item.Address?.StreetComponents?.[0];
  const region = item.Address?.Region?.Code ?? item.Address?.Region?.Name ?? '';
  const normalizedRegion = region.length > 0 ? normalizeStateCode(region) : '';
  const titleRaw = item.Title;
  const title = titleRaw !== undefined && titleRaw.length > 0 ? titleRaw : null;
  const unit = item.Address?.SecondaryAddressComponents?.[0]?.Number ?? null;

  return {
    matchScore: item.MatchScores?.Overall ?? 0,
    type: item.PlaceType ?? 'Unknown',
    title,
    addressNumber: item.Address?.AddressNumber ?? null,
    streetBaseName: street?.BaseName ?? null,
    streetType: street?.Type ?? null,
    streetPrefix: street?.Prefix ?? null,
    city: item.Address?.Locality ?? '',
    region: normalizedRegion,
    postalCode5: normalizeZip5(item.Address?.PostalCode),
    unit,
    lat,
    lng,
  };
};

const parseSearchTextResult = (
  item: SearchTextResultItemShape,
): GeocodeSuggestion | null => {
  const position = item.Position;
  if (position === undefined || position.length < 2) {
    return null;
  }
  const lng = position[0];
  const lat = position[1];
  if (lng === undefined || lat === undefined) {
    return null;
  }

  return {
    name: buildName(item),
    address: buildAddress(item),
    city: item.Address?.Locality ?? '',
    state: buildState(item),
    zip: normalizeZip5(item.Address?.PostalCode),
    lat,
    lng,
  };
};

export const createAwsLocationProvider = (): GeocodingProviderPort &
  RoutingProviderPort &
  MapTileProviderPort => {
  const placesClient = createGeoPlacesClient();
  const routesClient = createGeoRoutesClient();
  const mapsClient = createGeoMapsClient();

  return {
    searchAddresses: async (
      query: string,
      maxResults: number,
      biasPosition?: [number, number],
    ): Promise<GeocodeSuggestion[]> => {
      const command = new SearchTextCommand({
        QueryText: query,
        Filter: { IncludeCountries: ['USA'] },
        MaxResults: Math.min(maxResults, 10),
        BiasPosition: biasPosition ?? DEFAULT_BIAS_POSITION,
        IntendedUse: 'SingleUse',
      });

      const response = await placesClient.send(command);
      const results = response.ResultItems ?? [];

      return results
        .map((item) => parseSearchTextResult(item as SearchTextResultItemShape))
        .filter((suggestion): suggestion is GeocodeSuggestion => suggestion !== null);
    },

    geocode: async (structured: StructuredAddressInput): Promise<GeocodeResult | null> => {
      const command = new GeocodeCommand({
        QueryComponents: {
          AddressNumber: structured.addressNumber,
          Street: structured.street,
          Locality: structured.city,
          Region: structured.region,
          PostalCode: structured.postalCode,
        },
        IntendedUse: 'Storage',
        AdditionalFeatures: ['SecondaryAddresses'],
        Filter: { IncludeCountries: ['USA'] },
      });

      const response = await placesClient.send(command);
      const item = response.ResultItems?.[0];
      if (item === undefined) {
        return null;
      }
      return mapGeocodeItemToResult(item as GeocodeResultItemShape);
    },

    calculateRoute: async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
    ): Promise<RouteDistanceResult> => {
      const command = new CalculateRoutesCommand({
        Origin: [origin.lng, origin.lat],
        Destination: [destination.lng, destination.lat],
        TravelMode: 'Truck',
      });

      try {
        const response = await routesClient.send(command);
        const route = response.Routes?.[0];

        if (route === undefined || route.Summary === undefined) {
          throw new Error('Route calculation returned no summary');
        }

        const distanceMeters = route.Summary.Distance ?? 0;
        const durationSeconds = route.Summary.Duration ?? 0;

        return {
          distanceMiles: distanceMeters * METERS_TO_MILES,
          durationMinutes: durationSeconds / SECONDS_PER_MINUTE,
          isEstimated: false,
        };
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Route calculation failed: ${error.message}`);
        }
        throw new Error('Route calculation failed: unknown error');
      }
    },

    getStyleDescriptor: async (_mapName: string): Promise<MapStyleDescriptor> => {
      const command = new GetStyleDescriptorCommand({
        Style: DEFAULT_MAP_STYLE,
        ColorScheme: DEFAULT_COLOR_SCHEME,
      });
      const response = await mapsClient.send(command);

      if (!response.Blob) {
        throw new Error('Map style descriptor returned empty response');
      }

      return {
        contentType: response.ContentType ?? 'application/json',
        body: response.Blob,
      };
    },

    getMapTile: async (_mapName: string, coords: TileCoordinates): Promise<MapTile> => {
      const command = new GetTileCommand({
        Tileset: DEFAULT_TILESET,
        Z: coords.z,
        X: coords.x,
        Y: coords.y,
      });
      const response = await mapsClient.send(command);

      if (!response.Blob) {
        throw new Error('Map tile returned empty response');
      }

      return {
        contentType: response.ContentType ?? 'application/octet-stream',
        body: response.Blob,
      };
    },

    getSprites: async (_mapName: string, fileName: string): Promise<MapAsset> => {
      const command = new GetSpritesCommand({
        FileName: fileName,
        Style: DEFAULT_MAP_STYLE,
        ColorScheme: DEFAULT_COLOR_SCHEME,
        Variant: DEFAULT_VARIANT,
      });
      const response = await mapsClient.send(command);

      if (!response.Blob) {
        throw new Error('Map sprites returned empty response');
      }

      const extension = fileName.split('.').pop();
      const defaultContentType = extension === 'png' ? 'image/png' : 'application/json';

      return {
        contentType: response.ContentType ?? defaultContentType,
        body: response.Blob,
      };
    },

    getGlyphs: async (
      _mapName: string,
      fontStack: string,
      range: string,
    ): Promise<MapAsset> => {
      const command = new GetGlyphsCommand({
        FontStack: fontStack,
        FontUnicodeRange: range,
      });
      const response = await mapsClient.send(command);

      if (!response.Blob) {
        throw new Error('Map glyphs returned empty response');
      }

      return {
        contentType: response.ContentType ?? 'application/x-protobuf',
        body: response.Blob,
      };
    },
  };
};
