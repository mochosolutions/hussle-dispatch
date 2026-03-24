export interface GeocodeSuggestion {
  label: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
}

export interface GeocodingProviderPort {
  searchAddresses(query: string, maxResults: number): Promise<GeocodeSuggestion[]>;
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
