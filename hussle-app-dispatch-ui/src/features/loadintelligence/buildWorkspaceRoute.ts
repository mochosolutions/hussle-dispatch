import type { MockLoad, Stop, WorkspaceRoute } from './types';

const createStop = (
  type: 'pickup' | 'dropoff',
  location: MockLoad['origin'],
  commodity: string,
  weight: number | null,
): Stop => ({
  id: crypto.randomUUID(),
  type,
  location,
  commodity,
  weight,
});

const blankLocation = (): MockLoad['origin'] => ({
  city: '',
  state: '',
  country: 'US',
  zip: '',
});

export const buildWorkspaceRoute = (load: MockLoad): WorkspaceRoute => {
  const stops: Stop[] = [];

  // Origin pickup
  stops.push(createStop('pickup', load.origin, '', null));

  // Extra pickup stops
  Array.from({ length: load.pickupStops }).forEach(() => {
    stops.push(createStop('pickup', blankLocation(), '', null));
  });

  // Extra dropoff stops
  Array.from({ length: load.dropStops }).forEach(() => {
    stops.push(createStop('dropoff', blankLocation(), '', null));
  });

  // Destination dropoff
  stops.push(createStop('dropoff', load.destination, '', null));

  return {
    stops,
    totalMiles: load.miles,
    totalWeight: 0,
    originMarket: load.market,
    destinationMarket: load.destinationMarket,
  };
};
