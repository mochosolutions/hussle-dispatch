import { createStateMileageService } from '../stateMileageService';
import { calculateStateMiles } from '@/shared/geo/stateBoundaryLookup';

jest.mock('@/shared/geo/stateBoundaryLookup', () => ({
  calculateStateMiles: jest.fn(),
}));

const mockCalculateStateMiles = calculateStateMiles as jest.MockedFunction<typeof calculateStateMiles>;

const createMockDeps = () => ({
  routeCalculator: {
    calculateRoute: jest.fn(),
  },
  stateMilesRepo: {
    upsertMany: jest.fn(),
    deleteByLoadIdAndSource: jest.fn(),
    findByLoadId: jest.fn(),
  },
  loadMileageUpdate: {
    updateTotalMiles: jest.fn(),
  },
  stopQuery: {
    findStopsWithCoordinates: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
});

describe('stateMileageService', () => {
  let mockDeps: ReturnType<typeof createMockDeps>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeps = createMockDeps();
  });

  const loadId = 'load-1';
  const orgId = 'org-1';

  it('calculates and stores state miles when all stops have coordinates', async () => {
    // Arrange
    const stops = [
      { id: 's1', sequence: 1, latitude: 33.749, longitude: -84.388 },
      { id: 's2', sequence: 2, latitude: 34.052, longitude: -118.244 },
      { id: 's3', sequence: 3, latitude: 36.169, longitude: -115.14 },
    ];
    mockDeps.stopQuery.findStopsWithCoordinates.mockResolvedValue(stops);

    const routeResult = {
      totalDistanceKm: 3500,
      legs: [
        { distanceKm: 2000, durationSeconds: 7200, geometry: [[-84.388, 33.749], [-90.0, 35.0]] as [number, number][] },
        { distanceKm: 1500, durationSeconds: 5400, geometry: [[-90.0, 35.0], [-115.14, 36.169]] as [number, number][] },
      ],
      stateMiles: [],
    };
    mockDeps.routeCalculator.calculateRoute.mockResolvedValue(routeResult);

    mockCalculateStateMiles.mockReturnValue([
      { state: 'GA', miles: 200 },
      { state: 'CA', miles: 150 },
      { state: 'NV', miles: 100 },
    ]);

    // Act
    const service = createStateMileageService(mockDeps);
    await service.calculateAndStore(loadId, orgId);

    // Assert
    expect(mockDeps.stateMilesRepo.deleteByLoadIdAndSource).toHaveBeenCalledWith(
      loadId,
      'ROUTING_API',
    );
    expect(mockDeps.stateMilesRepo.upsertMany).toHaveBeenCalledWith(loadId, [
      { state: 'GA', miles: 200, source: 'ROUTING_API' },
      { state: 'CA', miles: 150, source: 'ROUTING_API' },
      { state: 'NV', miles: 100, source: 'ROUTING_API' },
    ]);
    expect(mockDeps.loadMileageUpdate.updateTotalMiles).toHaveBeenCalledWith(
      loadId,
      Math.round(3500 * 0.621371),
    );
    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      'State mileage calculated',
      expect.objectContaining({ loadId, stateCount: 3 }),
    );
  });

  it('skips calculation when fewer than 2 stops', async () => {
    // Arrange
    mockDeps.stopQuery.findStopsWithCoordinates.mockResolvedValue([
      { id: 's1', sequence: 1, latitude: 33.749, longitude: -84.388 },
    ]);

    // Act
    const service = createStateMileageService(mockDeps);
    await service.calculateAndStore(loadId, orgId);

    // Assert
    expect(mockDeps.routeCalculator.calculateRoute).not.toHaveBeenCalled();
    expect(mockDeps.stateMilesRepo.upsertMany).not.toHaveBeenCalled();
    expect(mockDeps.loadMileageUpdate.updateTotalMiles).not.toHaveBeenCalled();
  });

  it('skips calculation when a stop lacks coordinates', async () => {
    // Arrange
    mockDeps.stopQuery.findStopsWithCoordinates.mockResolvedValue([
      { id: 's1', sequence: 1, latitude: 33.749, longitude: -84.388 },
      { id: 's2', sequence: 2, latitude: null, longitude: -118.244 },
    ]);

    // Act
    const service = createStateMileageService(mockDeps);
    await service.calculateAndStore(loadId, orgId);

    // Assert
    expect(mockDeps.routeCalculator.calculateRoute).not.toHaveBeenCalled();
    expect(mockDeps.logger.debug).toHaveBeenCalledWith(
      'Skipping state mileage: stop missing coordinates',
      expect.objectContaining({ loadId }),
    );
  });

  it('deletes ROUTING_API rows but preserves MANUAL rows before inserting', async () => {
    // Arrange
    mockDeps.stopQuery.findStopsWithCoordinates.mockResolvedValue([
      { id: 's1', sequence: 1, latitude: 33.749, longitude: -84.388 },
      { id: 's2', sequence: 2, latitude: 34.052, longitude: -118.244 },
    ]);
    mockDeps.routeCalculator.calculateRoute.mockResolvedValue({
      totalDistanceKm: 100,
      legs: [{ distanceKm: 100, durationSeconds: 3600, geometry: [[-84.388, 33.749], [-118.244, 34.052]] as [number, number][] }],
      stateMiles: [],
    });
    mockCalculateStateMiles.mockReturnValue([{ state: 'GA', miles: 50 }]);

    // Act
    const service = createStateMileageService(mockDeps);
    await service.calculateAndStore(loadId, orgId);

    // Assert
    expect(mockDeps.stateMilesRepo.deleteByLoadIdAndSource).toHaveBeenCalledWith(
      loadId,
      'ROUTING_API',
    );
    // Verify it was NOT called with 'MANUAL'
    expect(mockDeps.stateMilesRepo.deleteByLoadIdAndSource).not.toHaveBeenCalledWith(
      loadId,
      'MANUAL',
    );
  });

  it('updates totalMiles with km-to-miles conversion', async () => {
    // Arrange
    mockDeps.stopQuery.findStopsWithCoordinates.mockResolvedValue([
      { id: 's1', sequence: 1, latitude: 33.749, longitude: -84.388 },
      { id: 's2', sequence: 2, latitude: 34.052, longitude: -118.244 },
    ]);
    mockDeps.routeCalculator.calculateRoute.mockResolvedValue({
      totalDistanceKm: 100,
      legs: [{ distanceKm: 100, durationSeconds: 3600, geometry: [[-84.388, 33.749], [-118.244, 34.052]] as [number, number][] }],
      stateMiles: [],
    });
    mockCalculateStateMiles.mockReturnValue([]);

    // Act
    const service = createStateMileageService(mockDeps);
    await service.calculateAndStore(loadId, orgId);

    // Assert — 100 km * 0.621371 = 62.1371, rounded to 62
    expect(mockDeps.loadMileageUpdate.updateTotalMiles).toHaveBeenCalledWith(
      loadId,
      62,
    );
  });

  it('logs warning and does not update on route calculator failure', async () => {
    // Arrange
    mockDeps.stopQuery.findStopsWithCoordinates.mockResolvedValue([
      { id: 's1', sequence: 1, latitude: 33.749, longitude: -84.388 },
      { id: 's2', sequence: 2, latitude: 34.052, longitude: -118.244 },
    ]);
    mockDeps.routeCalculator.calculateRoute.mockRejectedValue(new Error('API timeout'));

    // Act
    const service = createStateMileageService(mockDeps);
    await service.calculateAndStore(loadId, orgId);

    // Assert
    expect(mockDeps.logger.warn).toHaveBeenCalledWith(
      'Route calculation failed, skipping state mileage',
      expect.objectContaining({ loadId, error: 'API timeout' }),
    );
    expect(mockDeps.loadMileageUpdate.updateTotalMiles).not.toHaveBeenCalled();
    expect(mockDeps.stateMilesRepo.upsertMany).not.toHaveBeenCalled();
    expect(mockDeps.stateMilesRepo.deleteByLoadIdAndSource).not.toHaveBeenCalled();
  });
});
