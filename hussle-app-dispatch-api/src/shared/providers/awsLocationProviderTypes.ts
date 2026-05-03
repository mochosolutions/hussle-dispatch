export interface GeocodeSuggestion {
  name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
}

export interface StructuredAddressInput {
  addressNumber?: string;
  street?: string;
  unit?: string;
  city: string;
  region: string;
  postalCode?: string;
}

export interface GeocodeResult {
  matchScore: number;
  type:
    | 'PointAddress'
    | 'PointOfInterest'
    | 'InterpolatedAddress'
    | 'InferredSecondaryAddress'
    | 'Locality'
    | 'Region'
    | 'District'
    | string;
  title: string | null;
  addressNumber: string | null;
  streetBaseName: string | null;
  streetType: string | null;
  streetPrefix: string | null;
  city: string;
  region: string;
  postalCode5: string;
  unit: string | null;
  lat: number;
  lng: number;
}

export const ACCEPTED_GEOCODE_TYPES: ReadonlySet<string> = new Set([
  'PointAddress',
  'PointOfInterest',
  'InterpolatedAddress',
  'InferredSecondaryAddress',
]);

export interface GeocodingProviderPort {
  searchAddresses(
    query: string,
    maxResults: number,
    biasPosition?: [number, number],
  ): Promise<GeocodeSuggestion[]>;
  geocode(structured: StructuredAddressInput): Promise<GeocodeResult | null>;
}

export interface RouteDistanceResult {
  distanceMiles: number;
  durationMinutes: number;
  isEstimated: boolean;
}

export interface RoutingProviderPort {
  calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<RouteDistanceResult>;
}

export interface MapStyleDescriptor {
  contentType: string;
  body: Uint8Array;
}

export interface MapTile {
  contentType: string;
  body: Uint8Array;
}

export interface MapAsset {
  contentType: string;
  body: Uint8Array;
}

export interface TileCoordinates {
  z: string;
  x: string;
  y: string;
}

export interface MapTileProviderPort {
  getStyleDescriptor(mapName: string): Promise<MapStyleDescriptor>;
  getMapTile(mapName: string, coords: TileCoordinates): Promise<MapTile>;
  getSprites(mapName: string, fileName: string): Promise<MapAsset>;
  getGlyphs(mapName: string, fontStack: string, range: string): Promise<MapAsset>;
}
