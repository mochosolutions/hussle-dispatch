import type Redis from 'ioredis';
import { getCityCoords, haversineDistance } from '../geoLookup';

describe('haversineDistance', () => {
  it('calculates NYC to LA within 1% of the straight-line great-circle distance', () => {
    // New York City: 40.7128, -74.006
    // Los Angeles: 34.0522, -118.2437
    // Great-circle (straight-line) distance: ~2,446 miles
    const distance = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    const reference = 2446;

    expect(Math.abs(distance - reference) / reference).toBeLessThan(0.01);
  });

  it('calculates Chicago to Houston within 1% of the straight-line great-circle distance', () => {
    // Chicago: 41.8781, -87.6298
    // Houston: 29.7604, -95.3698
    // Great-circle (straight-line) distance: ~942 miles
    const distance = haversineDistance(41.8781, -87.6298, 29.7604, -95.3698);
    const reference = 942;

    expect(Math.abs(distance - reference) / reference).toBeLessThan(0.01);
  });

  it('returns 0 for identical coordinates', () => {
    const distance = haversineDistance(40.7128, -74.006, 40.7128, -74.006);

    expect(distance).toBe(0);
  });

  it('is symmetric — A to B equals B to A', () => {
    const aToB = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    const bToA = haversineDistance(34.0522, -118.2437, 40.7128, -74.006);

    expect(aToB).toBeCloseTo(bToA, 6);
  });

  it('calculates Dallas to Denver within 1% of the straight-line great-circle distance', () => {
    // Dallas: 32.7767, -96.797
    // Denver: 39.7392, -104.9903
    // Great-circle (straight-line) distance: ~663 miles
    const distance = haversineDistance(32.7767, -96.797, 39.7392, -104.9903);
    const reference = 663;

    expect(Math.abs(distance - reference) / reference).toBeLessThan(0.01);
  });
});

describe('getCityCoords', () => {
  const mockRedis = {
    hget: jest.fn(),
  } as unknown as Redis;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns coords when city is found in Redis', async () => {
    (mockRedis.hget as jest.Mock).mockResolvedValue('29.7604,-95.3698');

    const result = await getCityCoords(mockRedis, 'TX', 'Houston');

    expect(result).toEqual({ lat: 29.7604, lng: -95.3698 });
    expect(mockRedis.hget).toHaveBeenCalledWith('geo:cities', 'TX:houston');
  });

  it('normalizes state to uppercase and city to lowercase', async () => {
    (mockRedis.hget as jest.Mock).mockResolvedValue('40.7128,-74.006');

    await getCityCoords(mockRedis, 'ny', 'New York City');

    expect(mockRedis.hget).toHaveBeenCalledWith('geo:cities', 'NY:new york city');
  });

  it('returns null when city is not found in Redis', async () => {
    (mockRedis.hget as jest.Mock).mockResolvedValue(null);

    const result = await getCityCoords(mockRedis, 'TX', 'UnknownCity');

    expect(result).toBeNull();
  });

  it('returns null when Redis value has invalid format', async () => {
    (mockRedis.hget as jest.Mock).mockResolvedValue('invalid-data');

    const result = await getCityCoords(mockRedis, 'TX', 'Houston');

    expect(result).toBeNull();
  });

  it('returns null when lat is not a finite number', async () => {
    (mockRedis.hget as jest.Mock).mockResolvedValue('NaN,-95.3698');

    const result = await getCityCoords(mockRedis, 'TX', 'Houston');

    expect(result).toBeNull();
  });

  it('returns null when lng is not a finite number', async () => {
    (mockRedis.hget as jest.Mock).mockResolvedValue('29.7604,NaN');

    const result = await getCityCoords(mockRedis, 'TX', 'Houston');

    expect(result).toBeNull();
  });
});
