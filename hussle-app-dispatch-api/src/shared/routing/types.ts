export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteLeg {
  distanceKm: number;
  durationSeconds: number;
  geometry: [number, number][];
}

export interface StateMileEntry {
  state: string;
  miles: number;
}

export interface RouteResult {
  totalDistanceKm: number;
  legs: RouteLeg[];
  stateMiles: StateMileEntry[];
}
