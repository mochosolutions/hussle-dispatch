import { createRelayMapper } from '../mappers/relayMapper';
import type { StagedLoad } from '../types/loadBoardTypes';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-relay'),
}));

const buildWorkOpportunity = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'relay-source-1',
  payout: { value: 1500 },
  totalDistance: { value: 600 },
  deadhead: { value: 50 },
  loads: [
    {
      distance: { value: 550 },
      equipmentType: 'DRY_VAN',
      commodity: 'Electronics',
      loadType: 'FULL',
      stops: [{ city: 'Dallas' }],
    },
  ],
  transitOperatorType: 'SOLO',
  workType: 'LONG_HAUL',
  totalDuration: 3600000,
  firstPickupTime: '2026-04-10T08:00:00Z',
  lastDeliveryTime: '2026-04-11T08:00:00Z',
  startLocation: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
  endLocation: { city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298 },
  stopCount: 2,
  aggregatedCostItems: [
    { name: 'FUEL', value: 300 },
    { name: 'TOLLS', value: 50 },
  ],
  tags: ['EXPEDITED', 'HAZMAT'],
  ...overrides,
});

const mapOne = (raw: Record<string, unknown>): StagedLoad => {
  const mapper = createRelayMapper();
  const results = mapper.mapLoads([raw]);
  if (results.length === 0) {
    throw new Error('No results returned');
  }
  return results[0] as StagedLoad;
};

describe('createRelayMapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a complete workOpportunity correctly', () => {
    // Arrange
    const raw = buildWorkOpportunity();

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.source).toBe('relay');
    expect(result.sourceId).toBe('relay-source-1');
    expect(result.payout).toBe(1500);
    expect(result.totalMiles).toBe(600);
    expect(result.ratePerMile).toBe(2.5);
    expect(result.deadheadMiles).toBe(50);
    expect(result.loadedMiles).toBe(550);
    expect(result.equipmentType).toBe('DRY_VAN');
    expect(result.equipmentTypeRaw).toBe('DRY_VAN');
    expect(result.commodity).toBe('Electronics');
    expect(result.isTeamDriver).toBe(false);
    expect(result.workType).toBe('LONG_HAUL');
    expect(result.loadType).toBe('FULL');
    expect(result.totalDuration).toBe(60);
    expect(result.firstPickupTime).toBe('2026-04-10T08:00:00Z');
    expect(result.lastDeliveryTime).toBe('2026-04-11T08:00:00Z');
    expect(result.originCity).toBe('Dallas');
    expect(result.originState).toBe('TX');
    expect(result.originLat).toBe(32.7767);
    expect(result.originLng).toBe(-96.797);
    expect(result.destCity).toBe('Chicago');
    expect(result.destState).toBe('IL');
    expect(result.destLat).toBe(41.8781);
    expect(result.destLng).toBe(-87.6298);
    expect(result.stopCount).toBe(2);
    expect(result.tags).toEqual(['EXPEDITED', 'HAZMAT']);
    expect(result.id).toBe('test-uuid-relay');
    expect(result.ingestedAt).toBeDefined();
  });

  it('handles missing optional fields gracefully', () => {
    // Arrange
    const raw: Record<string, unknown> = {
      id: 'relay-minimal',
    };

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.payout).toBeNull();
    expect(result.totalMiles).toBeNull();
    expect(result.ratePerMile).toBeNull();
    expect(result.deadheadMiles).toBeNull();
    expect(result.loadedMiles).toBeNull();
    expect(result.equipmentType).toBeNull();
    expect(result.equipmentTypeRaw).toBeNull();
    expect(result.commodity).toBeNull();
    expect(result.isTeamDriver).toBe(false);
    expect(result.totalDuration).toBeNull();
    expect(result.tags).toBeNull();
    expect(result.costBreakdown).toBeNull();
  });

  it('calculates ratePerMile as payout / totalMiles rounded to 2 decimals', () => {
    // Arrange
    const raw = buildWorkOpportunity({
      payout: { value: 1000 },
      totalDistance: { value: 333 },
    });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.ratePerMile).toBe(3.0);
  });

  it('sets ratePerMile to null when totalMiles is zero', () => {
    // Arrange
    const raw = buildWorkOpportunity({
      payout: { value: 1000 },
      totalDistance: { value: 0 },
    });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.ratePerMile).toBeNull();
  });

  it('converts totalDuration from milliseconds to minutes', () => {
    // Arrange
    const raw = buildWorkOpportunity({ totalDuration: 7200000 });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.totalDuration).toBe(120);
  });

  it('maps equipment types via mapRelayEquipment', () => {
    // Arrange
    const raw = buildWorkOpportunity({
      loads: [{ equipmentType: 'REEFER_TRAILER', distance: { value: 100 } }],
    });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.equipmentType).toBe('REEFER');
  });

  it('sets isTeamDriver true when transitOperatorType is TEAM', () => {
    // Arrange
    const raw = buildWorkOpportunity({ transitOperatorType: 'TEAM' });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.isTeamDriver).toBe(true);
  });

  it('maps aggregatedCostItems to costBreakdown Record', () => {
    // Arrange
    const raw = buildWorkOpportunity({
      aggregatedCostItems: [
        { name: 'FUEL', value: 250 },
        { name: 'TOLLS', value: 75 },
      ],
    });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.costBreakdown).toEqual({ FUEL: 250, TOLLS: 75 });
  });

  it('truncates rawData (strips array values like loads)', () => {
    // Arrange
    const raw = buildWorkOpportunity();

    // Act
    const result = mapOne(raw);

    // Assert — loads array stripped from rawData
    expect(Array.isArray(result.rawData.loads)).toBe(false);
    expect(result.rawData.loads).toBeUndefined();
  });

  it('sets source to relay', () => {
    const result = mapOne(buildWorkOpportunity());
    expect(result.source).toBe('relay');
  });

  it('generates a UUID id', () => {
    const result = mapOne(buildWorkOpportunity());
    expect(result.id).toBe('test-uuid-relay');
  });

  it('sets ingestedAt to an ISO string', () => {
    const result = mapOne(buildWorkOpportunity());
    expect(() => new Date(result.ingestedAt)).not.toThrow();
    expect(result.ingestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('maps multiple loads in one call', () => {
    // Arrange
    const mapper = createRelayMapper();
    const raws = [buildWorkOpportunity({ id: 'a' }), buildWorkOpportunity({ id: 'b' })];

    // Act
    const results = mapper.mapLoads(raws);

    // Assert
    expect(results).toHaveLength(2);
    expect(results[0]?.sourceId).toBe('a');
    expect(results[1]?.sourceId).toBe('b');
  });
});
