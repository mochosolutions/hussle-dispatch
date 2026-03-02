import { calculateDriverFit } from '../calculateDriverFit';

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
