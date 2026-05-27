import {
  combinedExactAndSimilarLoadData,
  findDuplicates,
  findDuplicatesId,
} from '../utils/removeDuplicates';

interface MinimalLoad {
  matchId: string;
  companyName: string;
  equipmentTypeCode: string;
  weight: number;
  length: number;
  origin: { state: string; city: string };
  destination: { state: string; city: string };
}

const buildLoad = (overrides: Partial<MinimalLoad> & { matchId: string }): MinimalLoad => ({
  matchId: overrides.matchId,
  companyName: overrides.companyName ?? 'Acme Trucking',
  equipmentTypeCode: overrides.equipmentTypeCode ?? 'V',
  weight: overrides.weight ?? 40000,
  length: overrides.length ?? 53,
  origin: overrides.origin ?? { state: 'TX', city: 'Houston' },
  destination: overrides.destination ?? { state: 'CA', city: 'Los Angeles' },
});

describe('findDuplicatesId', () => {
  it('returns empty array when input is empty', () => {
    expect(findDuplicatesId([])).toEqual([]);
  });

  it('returns the second matchId when two loads share all dedup-key fields', () => {
    const loads: MinimalLoad[] = [
      buildLoad({ matchId: 'A1' }),
      buildLoad({ matchId: 'A2' }),
    ];

    const result = findDuplicatesId(loads);

    expect(result).toEqual(['A2']);
  });

  it('returns empty array when all loads are unique', () => {
    const loads: MinimalLoad[] = [
      buildLoad({ matchId: 'U1', origin: { state: 'TX', city: 'Houston' } }),
      buildLoad({ matchId: 'U2', origin: { state: 'OH', city: 'Akron' } }),
      buildLoad({ matchId: 'U3', companyName: 'Different Co' }),
    ];

    expect(findDuplicatesId(loads)).toEqual([]);
  });
});

describe('findDuplicates', () => {
  it('builds a counts map keyed by company+route+equipment+weight+length', () => {
    const loads: MinimalLoad[] = [
      buildLoad({ matchId: 'A1' }),
      buildLoad({ matchId: 'A2' }),
      buildLoad({ matchId: 'B1', origin: { state: 'NY', city: 'Buffalo' } }),
    ];

    const result = findDuplicates(loads);
    const entries = Object.values(result) as Array<{ count: number; matchIds: string[] }>;

    const dupGroup = entries.find((e) => e.count === 2);
    expect(dupGroup).toBeDefined();
    expect(dupGroup?.matchIds).toEqual(['A1', 'A2']);

    const uniqueGroup = entries.find((e) => e.count === 1);
    expect(uniqueGroup).toBeDefined();
    expect(uniqueGroup?.matchIds).toEqual(['B1']);
  });
});

describe('combinedExactAndSimilarLoadData', () => {
  it('concatenates matchDetails before similarMatchDetails', () => {
    const result = combinedExactAndSimilarLoadData({
      matchDetails: [{ a: 1 }],
      similarMatchDetails: [{ b: 2 }],
    });

    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('returns empty array when both fields are missing', () => {
    const result = combinedExactAndSimilarLoadData({});
    expect(result).toEqual([]);
  });
});
