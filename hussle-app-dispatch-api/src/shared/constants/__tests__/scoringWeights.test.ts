import { SCORING_WEIGHTS } from '../scoringWeights';

describe('SCORING_WEIGHTS', () => {
  describe('composite weights', () => {
    it('cpmProfitability is 40', () => {
      expect(SCORING_WEIGHTS.composite.cpmProfitability).toBe(40);
    });

    it('destinationMarket is 30', () => {
      expect(SCORING_WEIGHTS.composite.destinationMarket).toBe(30);
    });

    it('driverFit is 30', () => {
      expect(SCORING_WEIGHTS.composite.driverFit).toBe(30);
    });

    it('composite weights sum to 100', () => {
      const { cpmProfitability, destinationMarket, driverFit } = SCORING_WEIGHTS.composite;
      expect(cpmProfitability + destinationMarket + driverFit).toBe(100);
    });
  });

  describe('chain weights', () => {
    it('chainProfitability is 40', () => {
      expect(SCORING_WEIGHTS.chain.chainProfitability).toBe(40);
    });

    it('returnPositioning is 35', () => {
      expect(SCORING_WEIGHTS.chain.returnPositioning).toBe(35);
    });

    it('timeEfficiency is 25', () => {
      expect(SCORING_WEIGHTS.chain.timeEfficiency).toBe(25);
    });

    it('chain weights sum to 100', () => {
      const { chainProfitability, returnPositioning, timeEfficiency } = SCORING_WEIGHTS.chain;
      expect(chainProfitability + returnPositioning + timeEfficiency).toBe(100);
    });
  });
});
