import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  CalculateRouteCommand,
  GetMapStyleDescriptorCommand,
  GetMapTileCommand,
  GetMapSpritesCommand,
  GetMapGlyphsCommand,
} from '@aws-sdk/client-location';
import { env } from '@/config/env';
import type {
  GeocodeSuggestion,
  GeocodingProviderPort,
  MapAsset,
  MapStyleDescriptor,
  MapTile,
  MapTileProviderPort,
  RouteDistanceResult,
  RoutingProviderPort,
  TileCoordinates,
} from './awsLocationProviderTypes';
import { normalizeStateCode } from './normalizeStateCode';

const createLocationClient = (): LocationClient =>
  new LocationClient({
    region: env.AWS_REGION,
    credentials:
      env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

const parseResult = (
  result: {
    Place?: {
      Label?: string;
      AddressNumber?: string;
      Street?: string;
      Municipality?: string;
      Region?: string;
      PostalCode?: string;
      Geometry?: { Point?: number[] };
    };
  },
): GeocodeSuggestion | null => {
  const place = result.Place;
  if (place === undefined) {
    return null;
  }

  const point = place.Geometry?.Point;
  if (point === undefined || point.length < 2) {
    return null;
  }

  const lng = point[0];
  const lat = point[1];
  if (lng === undefined || lat === undefined) {
    return null;
  }

  const addressParts = [place.AddressNumber, place.Street].filter(Boolean);
  const address = addressParts.join(' ');
  const city = place.Municipality ?? '';
  const rawState = place.Region ?? '';
  const state = rawState.length > 0 ? normalizeStateCode(rawState) : '';
  const zip = place.PostalCode ?? '';

  // Extract POI/business name from the raw AWS Label when present.
  // AWS Label format: "Walmart, 455 E Wetmore Rd, Tucson, AZ 85705, USA"
  // The POI name is the first segment if it doesn't match any structured field.
  let poiName = '';
  const rawLabel = place.Label ?? '';
  if (rawLabel.length > 0) {
    const firstSegment = rawLabel.split(',')[0]?.trim() ?? '';
    const isStructuredField =
      firstSegment === place.AddressNumber ||
      firstSegment === place.Street ||
      firstSegment === address ||
      firstSegment === place.Municipality ||
      firstSegment === place.Region ||
      firstSegment === place.PostalCode;

    if (!isStructuredField && firstSegment.length > 0) {
      poiName = firstSegment;
    }
  }

  const labelParts: string[] = [];
  if (poiName.length > 0) {
    labelParts.push(poiName);
  }
  if (address.length > 0) {
    labelParts.push(address);
  }
  const cityState = [city, state].filter(Boolean).join(', ');
  if (cityState.length > 0) {
    labelParts.push(cityState);
  }
  if (zip.length > 0) {
    labelParts.push(zip);
  }
  const label = labelParts.length > 0 ? labelParts.join(', ') : rawLabel;

  return {
    label,
    address,
    city,
    state,
    zip,
    lat,
    lng,
  };
};

const KM_TO_MILES = 0.621371;
const SECONDS_PER_MINUTE = 60;

export const createAwsLocationProvider = (): GeocodingProviderPort &
  RoutingProviderPort &
  MapTileProviderPort => {
  const client = createLocationClient();

  return {
    searchAddresses: async (query: string, maxResults: number): Promise<GeocodeSuggestion[]> => {
      const command = new SearchPlaceIndexForTextCommand({
        IndexName: env.AWS_LOCATION_PLACE_INDEX_NAME,
        Text: query,
        FilterCountries: ['USA'],
        MaxResults: Math.min(maxResults, 10),
      });

      const response = await client.send(command);
      const results = response.Results ?? [];

      return results
        .map(parseResult)
        .filter((suggestion): suggestion is GeocodeSuggestion => suggestion !== null);
    },

    calculateRoute: async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
    ): Promise<RouteDistanceResult> => {
      const command = new CalculateRouteCommand({
        CalculatorName: env.AWS_LOCATION_ROUTE_CALCULATOR_NAME,
        DeparturePosition: [origin.lng, origin.lat],
        DestinationPosition: [destination.lng, destination.lat],
      });

      try {
        const response = await client.send(command);
        const summary = response.Summary;

        if (summary === undefined) {
          throw new Error('Route calculation returned no summary');
        }

        const distanceKm = summary.Distance ?? 0;
        const durationSeconds = summary.DurationSeconds ?? 0;

        return {
          distanceMiles: distanceKm * KM_TO_MILES,
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

    getStyleDescriptor: async (mapName: string): Promise<MapStyleDescriptor> => {
      const command = new GetMapStyleDescriptorCommand({ MapName: mapName });
      const response = await client.send(command);

      if (!response.Blob) {
        throw new Error('Map style descriptor returned empty response');
      }

      return {
        contentType: response.ContentType ?? 'application/json',
        body: response.Blob,
      };
    },

    getMapTile: async (mapName: string, coords: TileCoordinates): Promise<MapTile> => {
      const command = new GetMapTileCommand({
        MapName: mapName,
        Z: coords.z,
        X: coords.x,
        Y: coords.y,
      });
      const response = await client.send(command);

      if (!response.Blob) {
        throw new Error('Map tile returned empty response');
      }

      return {
        contentType: response.ContentType ?? 'application/octet-stream',
        body: response.Blob,
      };
    },

    getSprites: async (mapName: string, fileName: string): Promise<MapAsset> => {
      const command = new GetMapSpritesCommand({
        MapName: mapName,
        FileName: fileName,
      });
      const response = await client.send(command);

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

    getGlyphs: async (mapName: string, fontStack: string, range: string): Promise<MapAsset> => {
      const command = new GetMapGlyphsCommand({
        MapName: mapName,
        FontStack: fontStack,
        FontUnicodeRange: range,
      });
      const response = await client.send(command);

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
