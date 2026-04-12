import { createDatMapper } from '../mappers/datMapper';
import type { StagedLoad } from '../types/loadBoardTypes';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-dat'),
}));

const buildMatchDetail = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  matchId: 'dat-match-1',
  pickupDate: '2026-04-10',
  equipmentType: 'Van',
  equipmentTypeCode: 'V',
  companyName: 'Acme Freight',
  origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797, county: 'Dallas' },
  destination: { city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298, county: 'Cook' },
  tripMiles: 920,
  weight: 44000,
  length: 48,
  rate: 2300,
  rateBasedOn: 'FLAT',
  comments: ['Call before pickup', 'No touch freight'],
  contactName: { first: 'John', last: 'Smith' },
  callback: { email: 'dispatch@acme.com', type: 'EMAIL' },
  credit: { score: 85, daysToPay: 30 },
  availability: { earliest: '2026-04-10T06:00:00Z', latest: '2026-04-10T12:00:00Z' },
  ...overrides,
});

const mapOne = (raw: Record<string, unknown>): StagedLoad => {
  const mapper = createDatMapper();
  const results = mapper.mapLoads([raw]);
  if (results.length === 0) {
    throw new Error('No results returned');
  }
  return results[0] as StagedLoad;
};

describe('createDatMapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a complete matchDetail correctly', () => {
    // Arrange
    const raw = buildMatchDetail();

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.source).toBe('dat');
    expect(result.sourceId).toBe('dat-match-1');
    expect(result.payout).toBe(2300);
    expect(result.totalMiles).toBe(920);
    expect(result.ratePerMile).toBeCloseTo(2.5, 2);
    expect(result.deadheadMiles).toBeNull();
    expect(result.loadedMiles).toBeNull();
    expect(result.equipmentType).toBe('DRY_VAN');
    expect(result.equipmentTypeRaw).toBe('V');
    expect(result.commodity).toBeNull();
    expect(result.isTeamDriver).toBe(false);
    expect(result.workType).toBeNull();
    expect(result.loadType).toBeNull();
    expect(result.totalDuration).toBeNull();
    expect(result.firstPickupTime).toBe('2026-04-10');
    expect(result.lastDeliveryTime).toBeNull();
    expect(result.originCity).toBe('Dallas');
    expect(result.originState).toBe('TX');
    expect(result.originLat).toBe(32.7767);
    expect(result.originLng).toBe(-96.797);
    expect(result.destCity).toBe('Chicago');
    expect(result.destState).toBe('IL');
    expect(result.destLat).toBe(41.8781);
    expect(result.destLng).toBe(-87.6298);
    expect(result.stopCount).toBeNull();
    expect(result.costBreakdown).toBeNull();
    expect(result.tags).toBeNull();
    expect(result.id).toBe('test-uuid-dat');
    expect(result.ingestedAt).toBeDefined();
  });

  it('handles missing rate — payout and ratePerMile are null', () => {
    // Arrange
    const raw = buildMatchDetail({ rate: undefined });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.payout).toBeNull();
    expect(result.ratePerMile).toBeNull();
  });

  it('maps DAT equipment codes via mapDatEquipment', () => {
    // Arrange
    const raw = buildMatchDetail({ equipmentTypeCode: 'R' });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.equipmentType).toBe('REEFER');
    expect(result.equipmentTypeRaw).toBe('R');
  });

  it('sets source to dat', () => {
    const result = mapOne(buildMatchDetail());
    expect(result.source).toBe('dat');
  });

  it('handles missing matchId by using generated UUID for sourceId', () => {
    // Arrange
    const raw = buildMatchDetail({ matchId: undefined });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.sourceId).toBe('test-uuid-dat');
  });

  it('truncates rawData and strips comments array', () => {
    // Arrange
    const raw = buildMatchDetail();

    // Act
    const result = mapOne(raw);

    // Assert — comments array stripped from rawData
    expect(result.rawData.comments).toBeUndefined();
  });

  it('preserves companyName, credit, and contactName in rawData', () => {
    // Arrange
    const raw = buildMatchDetail();

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.rawData.companyName).toBe('Acme Freight');
    expect(result.rawData.credit).toEqual({ score: 85, daysToPay: 30 });
    expect(result.rawData.contactName).toEqual({ first: 'John', last: 'Smith' });
  });

  it('handles unknown equipment code returning null equipmentType', () => {
    // Arrange
    const raw = buildMatchDetail({ equipmentTypeCode: 'XX' });

    // Act
    const result = mapOne(raw);

    // Assert
    expect(result.equipmentType).toBeNull();
    expect(result.equipmentTypeRaw).toBe('XX');
  });

  it('maps multiple loads in one call', () => {
    // Arrange
    const mapper = createDatMapper();
    const raws = [buildMatchDetail({ matchId: 'a' }), buildMatchDetail({ matchId: 'b' })];

    // Act
    const results = mapper.mapLoads(raws);

    // Assert
    expect(results).toHaveLength(2);
    expect(results[0]?.sourceId).toBe('a');
    expect(results[1]?.sourceId).toBe('b');
  });

  it('sets ingestedAt to an ISO string', () => {
    const result = mapOne(buildMatchDetail());
    expect(result.ingestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
