/**
 * Scoring weight constants for load intelligence composite and chain scores.
 * All weights within a group sum to 100.
 */

export interface CompositeScoreWeights {
  readonly cpmProfitability: number;
  readonly destinationMarket: number;
  readonly driverFit: number;
}

export interface ChainScoreWeights {
  readonly chainProfitability: number;
  readonly returnPositioning: number;
  readonly timeEfficiency: number;
}

export interface ScoringWeights {
  readonly composite: CompositeScoreWeights;
  readonly chain: ChainScoreWeights;
}

export const SCORING_WEIGHTS: ScoringWeights = Object.freeze({
  composite: Object.freeze({
    cpmProfitability: 40,
    destinationMarket: 30,
    driverFit: 30,
  }),
  chain: Object.freeze({
    chainProfitability: 40,
    returnPositioning: 35,
    timeEfficiency: 25,
  }),
});
