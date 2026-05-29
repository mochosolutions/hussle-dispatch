export interface CameraPointInput {
  lat: number;
  lng: number;
}

export type CameraTarget =
  | { kind: 'noop' }
  | { kind: 'jump'; center: [number, number]; zoom: number }
  | { kind: 'fit'; points: [number, number][] };

const SINGLE_POINT_ZOOM = 8;

export const computeCameraTarget = (
  validStops: CameraPointInput[],
  validDriver: CameraPointInput | null,
): CameraTarget => {
  const points: [number, number][] = validStops.map((s) => [s.lng, s.lat]);
  if (validDriver !== null) {
    points.push([validDriver.lng, validDriver.lat]);
  }

  if (points.length === 0) {
    return { kind: 'noop' };
  }

  if (points.length === 1) {
    const [center] = points;
    if (center === undefined) {
      return { kind: 'noop' };
    }
    return { kind: 'jump', center, zoom: SINGLE_POINT_ZOOM };
  }

  return { kind: 'fit', points };
};
