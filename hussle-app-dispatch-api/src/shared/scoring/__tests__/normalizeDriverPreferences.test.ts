import { normalizeLanes, normalizeZones } from '../normalizeDriverPreferences';

describe('normalizeLanes', () => {
  it('converts structured lane objects with city to "destState:destCity" format', () => {
    // Arrange
    const input = [{ originState: 'TX', destState: 'CA', originCity: 'Dallas', destCity: 'LA' }];

    // Act
    const result = normalizeLanes(input);

    // Assert
    expect(result).toEqual(['CA:LA']);
  });

  it('converts structured lane objects without destCity to "destState:" format', () => {
    // Arrange
    const input = [{ originState: 'TX', destState: 'CA' }];

    // Act
    const result = normalizeLanes(input);

    // Assert
    expect(result).toEqual(['CA:']);
  });

  it('passes through already-string values unchanged', () => {
    // Arrange
    const input = ['CA:LA', 'TX:Dallas'];

    // Act
    const result = normalizeLanes(input);

    // Assert
    expect(result).toEqual(['CA:LA', 'TX:Dallas']);
  });

  it('skips null and undefined items', () => {
    // Arrange
    const input = [null, undefined];

    // Act
    const result = normalizeLanes(input);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    // Arrange
    const input: unknown[] = [];

    // Act
    const result = normalizeLanes(input);

    // Assert
    expect(result).toEqual([]);
  });

  it('skips objects missing destState property', () => {
    // Arrange
    const input = [{ originState: 'TX', originCity: 'Dallas' }];

    // Act
    const result = normalizeLanes(input);

    // Assert
    expect(result).toEqual([]);
  });

  it('handles mixed arrays (some strings, some objects, some nulls)', () => {
    // Arrange
    const input = [
      'CA:LA',
      { originState: 'TX', destState: 'FL', destCity: 'Miami' },
      null,
      { originState: 'GA', destState: 'NY' },
      undefined,
      'IL:Chicago',
    ];

    // Act
    const result = normalizeLanes(input);

    // Assert
    expect(result).toEqual(['CA:LA', 'FL:Miami', 'NY:', 'IL:Chicago']);
  });
});

describe('normalizeZones', () => {
  it('converts structured zone objects with city to "state:city" format', () => {
    // Arrange
    const input = [{ state: 'CA', city: 'LA' }];

    // Act
    const result = normalizeZones(input);

    // Assert
    expect(result).toEqual(['CA:LA']);
  });

  it('converts structured zone objects without city to "state:" format', () => {
    // Arrange
    const input = [{ state: 'CA' }];

    // Act
    const result = normalizeZones(input);

    // Assert
    expect(result).toEqual(['CA:']);
  });

  it('passes through already-string values unchanged', () => {
    // Arrange
    const input = ['CA:LA', 'TX:Dallas'];

    // Act
    const result = normalizeZones(input);

    // Assert
    expect(result).toEqual(['CA:LA', 'TX:Dallas']);
  });

  it('skips null and undefined items', () => {
    // Arrange
    const input = [null, undefined];

    // Act
    const result = normalizeZones(input);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    // Arrange
    const input: unknown[] = [];

    // Act
    const result = normalizeZones(input);

    // Assert
    expect(result).toEqual([]);
  });

  it('skips objects missing state property', () => {
    // Arrange
    const input = [{ city: 'LA' }];

    // Act
    const result = normalizeZones(input);

    // Assert
    expect(result).toEqual([]);
  });

  it('handles mixed arrays (some strings, some objects, some nulls)', () => {
    // Arrange
    const input = [
      'CA:LA',
      { state: 'FL', city: 'Miami' },
      null,
      { state: 'NY' },
      undefined,
      'IL:Chicago',
    ];

    // Act
    const result = normalizeZones(input);

    // Assert
    expect(result).toEqual(['CA:LA', 'FL:Miami', 'NY:', 'IL:Chicago']);
  });
});
