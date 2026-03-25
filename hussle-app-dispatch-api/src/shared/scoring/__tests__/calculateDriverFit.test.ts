import { calculateDriverFit } from '../calculateDriverFit';
import { normalizeLanes, normalizeZones } from '../normalizeDriverPreferences';
import { SCORING_WEIGHTS } from '../../constants/scoringWeights';

const MAX_POINTS = SCORING_WEIGHTS.composite.driverFit;

describe('calculateDriverFit', () => {
  describe('preferred lane match — 30 points', () => {
    it('returns 30 points when destination is in preferred lanes', () => {
      // Arrange
      const input = {
        preferredLanes: ['TX', 'OK', 'KS'],
        noGoZones: ['NY', 'NJ'],
        homeBase: 'TX',
        destination: 'OK',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 300,
      };

      // Act
      const result = calculateDriverFit(input);

      // Assert
      expect(result.points).toBe(30);
      expect(result.isPreferredLane).toBe(true);
      expect(result.isNoGoZone).toBe(false);
    });

    it('returns isPreferredLane=true and isNoGoZone=false for preferred destination', () => {
      const result = calculateDriverFit({
        preferredLanes: ['TX'],
        noGoZones: ['NY'],
        homeBase: 'TX',
        destination: 'TX',
        maxDaysOut: 7,
        currentDaysOut: 0,
        milesFromHome: 0,
      });

      expect(result.isPreferredLane).toBe(true);
      expect(result.isNoGoZone).toBe(false);
    });
  });

  describe('no-go zone — 0 points', () => {
    it('returns 0 points when destination is in no-go zones', () => {
      // Arrange
      const input = {
        preferredLanes: ['TX', 'OK'],
        noGoZones: ['NY', 'NJ'],
        homeBase: 'TX',
        destination: 'NY',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 1500,
      };

      // Act
      const result = calculateDriverFit(input);

      // Assert
      expect(result.points).toBe(0);
      expect(result.isNoGoZone).toBe(true);
      expect(result.isPreferredLane).toBe(false);
    });
  });

  describe('distance-based scoring for non-matching destinations', () => {
    it('returns points between 0 and 30 for non-preferred, non-no-go destination', () => {
      const input = {
        preferredLanes: ['TX'],
        noGoZones: ['NY'],
        homeBase: 'TX',
        destination: 'IL',
        maxDaysOut: 7,
        currentDaysOut: 3,
        milesFromHome: 800,
      };

      const result = calculateDriverFit(input);

      expect(result.points).toBeGreaterThanOrEqual(0);
      expect(result.points).toBeLessThanOrEqual(30);
      expect(result.isPreferredLane).toBe(false);
      expect(result.isNoGoZone).toBe(false);
    });

    it('returns fewer points when farther from home', () => {
      const nearHome = calculateDriverFit({
        preferredLanes: ['TX'],
        noGoZones: ['NY'],
        homeBase: 'TX',
        destination: 'IL',
        maxDaysOut: 7,
        currentDaysOut: 1,
        milesFromHome: 200,
      });

      const farFromHome = calculateDriverFit({
        preferredLanes: ['TX'],
        noGoZones: ['NY'],
        homeBase: 'TX',
        destination: 'IL',
        maxDaysOut: 7,
        currentDaysOut: 6,
        milesFromHome: 1800,
      });

      expect(nearHome.points).toBeGreaterThan(farFromHome.points);
    });
  });

  describe('return shape', () => {
    it('returns all required fields', () => {
      const result = calculateDriverFit({
        preferredLanes: ['TX'],
        noGoZones: ['NY'],
        homeBase: 'TX',
        destination: 'OK',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 300,
      });

      expect(typeof result.isPreferredLane).toBe('boolean');
      expect(typeof result.isNoGoZone).toBe('boolean');
      expect(typeof result.milesFromHome).toBe('number');
      expect(typeof result.daysFromHome).toBe('number');
      expect(typeof result.exceedsMaxDaysOut).toBe('boolean');
      expect(typeof result.points).toBe('number');
    });

    it('reflects milesFromHome from input', () => {
      const result = calculateDriverFit({
        preferredLanes: [],
        noGoZones: [],
        homeBase: 'TX',
        destination: 'IL',
        maxDaysOut: 7,
        currentDaysOut: 3,
        milesFromHome: 750,
      });

      expect(result.milesFromHome).toBe(750);
    });

    it('reflects daysFromHome from currentDaysOut', () => {
      const result = calculateDriverFit({
        preferredLanes: [],
        noGoZones: [],
        homeBase: 'TX',
        destination: 'IL',
        maxDaysOut: 7,
        currentDaysOut: 4,
        milesFromHome: 500,
      });

      expect(result.daysFromHome).toBe(4);
    });

    it('exceedsMaxDaysOut is true when currentDaysOut > maxDaysOut', () => {
      const result = calculateDriverFit({
        preferredLanes: [],
        noGoZones: [],
        homeBase: 'TX',
        destination: 'IL',
        maxDaysOut: 5,
        currentDaysOut: 6,
        milesFromHome: 500,
      });

      expect(result.exceedsMaxDaysOut).toBe(true);
    });

    it('exceedsMaxDaysOut is false when currentDaysOut <= maxDaysOut', () => {
      const result = calculateDriverFit({
        preferredLanes: [],
        noGoZones: [],
        homeBase: 'TX',
        destination: 'IL',
        maxDaysOut: 7,
        currentDaysOut: 5,
        milesFromHome: 300,
      });

      expect(result.exceedsMaxDaysOut).toBe(false);
    });
  });

  describe('points bounds', () => {
    it('points are always between 0 and 30 inclusive', () => {
      const cases = [
        { preferredLanes: ['TX'], noGoZones: [], destination: 'TX', currentDaysOut: 0, milesFromHome: 0 },
        { preferredLanes: [], noGoZones: ['NY'], destination: 'NY', currentDaysOut: 10, milesFromHome: 2000 },
        { preferredLanes: [], noGoZones: [], destination: 'IL', currentDaysOut: 3, milesFromHome: 500 },
      ];

      cases.forEach((c) => {
        const result = calculateDriverFit({
          ...c,
          homeBase: 'TX',
          maxDaysOut: 7,
        });
        expect(result.points).toBeGreaterThanOrEqual(0);
        expect(result.points).toBeLessThanOrEqual(30);
      });
    });
  });
});

/**
 * Integration tests: structured Prisma driver data -> normalize -> calculateDriverFit.
 * Simulates the full scoring path as it would run in production.
 */
describe('calculateDriverFit — integration (normalize -> score)', () => {
  /**
   * Helper that mirrors the production pipeline:
   * 1. Take structured Prisma-shaped driver preferences
   * 2. Normalize lanes and zones to "state:city" strings
   * 3. Run calculateDriverFit with the normalized data
   */
  const scoreFromPrismaData = (params: {
    prismaLanes: unknown[];
    prismaZones: unknown[];
    homeBase: string;
    destination: string;
    maxDaysOut: number;
    currentDaysOut: number;
    milesFromHome: number;
  }) => {
    const preferredLanes = normalizeLanes(params.prismaLanes);
    const noGoZones = normalizeZones(params.prismaZones);

    return calculateDriverFit({
      preferredLanes,
      noGoZones,
      homeBase: params.homeBase,
      destination: params.destination,
      maxDaysOut: params.maxDaysOut,
      currentDaysOut: params.currentDaysOut,
      milesFromHome: params.milesFromHome,
    });
  };

  describe('preferred lane matching', () => {
    it('scores MAX_POINTS when structured lane with city matches destination', () => {
      // Arrange — Prisma returns lane with originState, destState, destCity
      const result = scoreFromPrismaData({
        prismaLanes: [{ originState: 'TX', destState: 'OK', destCity: 'Tulsa' }],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'OK:Tulsa',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 300,
      });

      // Assert
      expect(result.isPreferredLane).toBe(true);
      expect(result.points).toBe(MAX_POINTS);
    });

    it('scores MAX_POINTS when structured lane without city matches state-only destination', () => {
      // Arrange — lane has no destCity, normalizes to "OK:"
      const result = scoreFromPrismaData({
        prismaLanes: [{ originState: 'TX', destState: 'OK' }],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'OK:',
        maxDaysOut: 7,
        currentDaysOut: 1,
        milesFromHome: 250,
      });

      // Assert
      expect(result.isPreferredLane).toBe(true);
      expect(result.points).toBe(MAX_POINTS);
    });

    it('returns isPreferredLane=false when no lanes match destination', () => {
      // Arrange — driver prefers TX->OK, but load goes to CA:LA
      const result = scoreFromPrismaData({
        prismaLanes: [
          { originState: 'TX', destState: 'OK', destCity: 'Tulsa' },
          { originState: 'TX', destState: 'AR', destCity: 'LittleRock' },
        ],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'CA:LA',
        maxDaysOut: 7,
        currentDaysOut: 3,
        milesFromHome: 1200,
      });

      // Assert
      expect(result.isPreferredLane).toBe(false);
      expect(result.points).toBeLessThan(MAX_POINTS);
    });
  });

  describe('no-go zone matching', () => {
    it('scores 0 when structured zone with city matches destination', () => {
      // Arrange — driver has CA:LA as no-go
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [{ state: 'CA', city: 'LA' }],
        homeBase: 'TX:Dallas',
        destination: 'CA:LA',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 1400,
      });

      // Assert
      expect(result.isNoGoZone).toBe(true);
      expect(result.points).toBe(0);
    });

    it('scores 0 when structured zone without city matches state-only destination', () => {
      // Arrange — driver has entire CA as no-go (no city)
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [{ state: 'CA' }],
        homeBase: 'TX:Dallas',
        destination: 'CA:',
        maxDaysOut: 7,
        currentDaysOut: 1,
        milesFromHome: 1300,
      });

      // Assert
      expect(result.isNoGoZone).toBe(true);
      expect(result.points).toBe(0);
    });

    it('returns isNoGoZone=false when no zones match destination', () => {
      // Arrange — driver avoids CA and NY, load goes to FL
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [{ state: 'CA', city: 'LA' }, { state: 'NY', city: 'NYC' }],
        homeBase: 'TX:Dallas',
        destination: 'FL:Miami',
        maxDaysOut: 7,
        currentDaysOut: 3,
        milesFromHome: 1000,
      });

      // Assert
      expect(result.isNoGoZone).toBe(false);
      expect(result.points).toBeGreaterThan(0);
    });
  });

  describe('home base proximity (distance-based decay)', () => {
    it('awards high points when close to home (100 miles)', () => {
      // Arrange — 100 miles from home, no lane/zone match
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'TX:FortWorth',
        maxDaysOut: 7,
        currentDaysOut: 1,
        milesFromHome: 100,
      });

      // Assert — 100/1500 = 0.067 ratio, expect ~28 points (30 * 0.933)
      expect(result.points).toBeGreaterThanOrEqual(27);
      expect(result.points).toBeLessThanOrEqual(MAX_POINTS);
    });

    it('awards low points when far from home (1400 miles)', () => {
      // Arrange — 1400 miles from home
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'WA:Seattle',
        maxDaysOut: 7,
        currentDaysOut: 3,
        milesFromHome: 1400,
      });

      // Assert — 1400/1500 = 0.933 ratio, expect ~2 points (30 * 0.067)
      expect(result.points).toBeLessThanOrEqual(3);
      expect(result.points).toBeGreaterThanOrEqual(0);
    });

    it('awards 0 points at max distance (1500+ miles)', () => {
      // Arrange — at or beyond max distance threshold
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'ME:Portland',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 1500,
      });

      // Assert — 1500/1500 = 1.0 ratio, 30 * (1 - 1) = 0
      expect(result.points).toBe(0);
    });
  });

  describe('days out constraint', () => {
    it('applies no penalty when within max days', () => {
      // Arrange — 3 days out of 7 max, 500 miles from home
      const withinLimit = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'OK:OKC',
        maxDaysOut: 7,
        currentDaysOut: 3,
        milesFromHome: 500,
      });

      // Assert — no penalty, pure distance-based score
      // 500/1500 = 0.333 ratio, 30 * 0.667 = 20
      expect(withinLimit.exceedsMaxDaysOut).toBe(false);
      expect(withinLimit.points).toBe(20);
    });

    it('applies 50% penalty when over max days', () => {
      // Arrange — same distance, but over max days
      const overLimit = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'OK:OKC',
        maxDaysOut: 7,
        currentDaysOut: 9,
        milesFromHome: 500,
      });

      // Assert — 50% penalty applied: 20 * 0.5 = 10
      expect(overLimit.exceedsMaxDaysOut).toBe(true);
      expect(overLimit.points).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('returns no lane match when preferredLanes array is empty', () => {
      // Arrange
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'OK:Tulsa',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 300,
      });

      // Assert
      expect(result.isPreferredLane).toBe(false);
    });

    it('returns no zone match when noGoZones array is empty', () => {
      // Arrange
      const result = scoreFromPrismaData({
        prismaLanes: [],
        prismaZones: [],
        homeBase: 'TX:Dallas',
        destination: 'CA:LA',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 1400,
      });

      // Assert
      expect(result.isNoGoZone).toBe(false);
    });

    it('no-go zone wins over preferred lane match (points=0)', () => {
      // Arrange — destination matches both a preferred lane AND a no-go zone
      const result = scoreFromPrismaData({
        prismaLanes: [{ originState: 'TX', destState: 'CA', destCity: 'LA' }],
        prismaZones: [{ state: 'CA', city: 'LA' }],
        homeBase: 'TX:Dallas',
        destination: 'CA:LA',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 1400,
      });

      // Assert — no-go zone takes priority
      expect(result.isPreferredLane).toBe(true);
      expect(result.isNoGoZone).toBe(true);
      expect(result.points).toBe(0);
    });

    it('handles null/undefined items in preference arrays gracefully', () => {
      // Arrange — Prisma could return nulls in JSON arrays
      const result = scoreFromPrismaData({
        prismaLanes: [null, undefined, { originState: 'TX', destState: 'OK', destCity: 'Tulsa' }],
        prismaZones: [null, undefined, { state: 'CA', city: 'LA' }],
        homeBase: 'TX:Dallas',
        destination: 'OK:Tulsa',
        maxDaysOut: 7,
        currentDaysOut: 2,
        milesFromHome: 300,
      });

      // Assert — nulls are skipped, valid items still normalize correctly
      expect(result.isPreferredLane).toBe(true);
      expect(result.points).toBe(MAX_POINTS);
    });
  });
});
