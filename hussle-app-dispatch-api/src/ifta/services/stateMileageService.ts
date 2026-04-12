import type { MileageSource } from '@prisma/client';
import type { RouteCalculatorPort } from '@/shared/routing/routeCalculatorPort';
import type { Logger } from '@/shared/utils/logger';
import { calculateStateMiles } from '@/shared/geo/stateBoundaryLookup';
import type {
  LoadMileageUpdatePort,
  StateMilesRepoPort,
  StopCoordinateQueryPort,
} from '../types/iftaTypes';

const KM_TO_MILES = 0.621371;
const ROUTING_API_SOURCE: MileageSource = 'ROUTING_API';

export interface StateMileageService {
  calculateAndStore(loadId: string, organizationId: string): Promise<void>;
}

interface StateMileageServiceDeps {
  routeCalculator: RouteCalculatorPort;
  stateMilesRepo: StateMilesRepoPort;
  loadMileageUpdate: LoadMileageUpdatePort;
  stopQuery: StopCoordinateQueryPort;
  logger: Logger;
}

export const createStateMileageService = (
  deps: StateMileageServiceDeps,
): StateMileageService => ({
  calculateAndStore: async (loadId, organizationId) => {
    const stops = await deps.stopQuery.findStopsWithCoordinates(loadId, organizationId);

    if (stops.length < 2) {
      deps.logger.debug('Skipping state mileage: fewer than 2 stops', { loadId });
      return;
    }

    const missingCoords = stops.some(
      (stop) => stop.latitude === null || stop.longitude === null,
    );

    if (missingCoords) {
      deps.logger.debug('Skipping state mileage: stop missing coordinates', { loadId });
      return;
    }

    const waypoints = stops.map((s) => ({
      lat: Number(s.latitude),
      lng: Number(s.longitude),
    }));

    let routeResult;
    try {
      routeResult = await deps.routeCalculator.calculateRoute(waypoints);
    } catch (error: unknown) {
      deps.logger.warn('Route calculation failed, skipping state mileage', {
        loadId,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    const combinedGeometry = routeResult.legs.flatMap((leg) => leg.geometry);
    const stateMiles = calculateStateMiles(combinedGeometry);

    await deps.stateMilesRepo.deleteByLoadIdAndSource(loadId, ROUTING_API_SOURCE);

    if (stateMiles.length > 0) {
      await deps.stateMilesRepo.upsertMany(
        loadId,
        stateMiles.map((sm) => ({
          state: sm.state,
          miles: sm.miles,
          source: ROUTING_API_SOURCE,
        })),
      );
    }

    const totalMiles = Math.round(routeResult.totalDistanceKm * KM_TO_MILES);
    await deps.loadMileageUpdate.updateTotalMiles(loadId, totalMiles);

    deps.logger.info('State mileage calculated', {
      loadId,
      stateCount: stateMiles.length,
      totalMiles,
    });
  },
});
