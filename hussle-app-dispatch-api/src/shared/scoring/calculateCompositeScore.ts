import { MARKET_TIERS } from '../constants/marketTiers';
import type { MarketTier } from '../constants/marketTiers';
import { SCORING_WEIGHTS } from '../constants/scoringWeights';

const MAX_CPM_POINTS = SCORING_WEIGHTS.composite.cpmProfitability;

/**
 * Rate-to-CPM ratios that define CPM scoring tiers.
 * A ratio of ratePerMile / vehicleCpm above EXCELLENT_RATIO gets max points.
 */
const CPM_RATIO_EXCELLENT = 3.0;
const CPM_RATIO_GOOD = 2.0;
const CPM_RATIO_FAIR = 1.5;

const MARKET_TIER_POINTS: Record<MarketTier, number> = {
  [MARKET_TIERS.STRONG]: 30,
  [MARKET_TIERS.MODERATE]: 20,
  [MARKET_TIERS.WEAK]: 10,
  [MARKET_TIERS.UNKNOWN]: 5,
};

type ScoreType = 'full' | 'route';

interface CompositeScoreFullInput {
  mode: 'full';
  vehicleCpm: number;
  ratePerMile: number;
  marketTier: MarketTier;
  driverFitPoints: number;
}

interface CompositeScoreRouteInput {
  mode: 'route';
  marketTier: MarketTier;
  driverFitPoints: number;
}

type CompositeScoreInput = CompositeScoreFullInput | CompositeScoreRouteInput;

export interface CompositeScoreResult {
  cpmPoints: number;
  marketPoints: number;
  driverFitPoints: number;
  compositeScore: number;
  scoreType: ScoreType;
  compositeLabel: string;
}

/**
 * Calculates the CPM profitability score (0-40) based on rate-to-CPM ratio.
 */
const scoreCpm = (vehicleCpm: number, ratePerMile: number): number => {
  if (vehicleCpm <= 0) return 0;

  const ratio = ratePerMile / vehicleCpm;

  if (ratio >= CPM_RATIO_EXCELLENT) return MAX_CPM_POINTS;
  if (ratio >= CPM_RATIO_GOOD) {
    const progress = (ratio - CPM_RATIO_GOOD) / (CPM_RATIO_EXCELLENT - CPM_RATIO_GOOD);
    return Math.round(20 + progress * 20);
  }
  if (ratio >= CPM_RATIO_FAIR) {
    const progress = (ratio - CPM_RATIO_FAIR) / (CPM_RATIO_GOOD - CPM_RATIO_FAIR);
    return Math.round(progress * 20);
  }

  return 0;
};

const getFullModeLabel = (score: number): string => {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

const getRouteModeLabel = (score: number): string => {
  if (score >= 50) return 'Excellent';
  if (score >= 35) return 'Good';
  if (score >= 20) return 'Fair';
  return 'Poor';
};

/**
 * Calculates composite load score combining CPM profitability, destination market
 * strength, and driver fit.
 *
 * Full mode: all three dimensions scored (max 100).
 * Route mode: CPM skipped, only market + driver fit (max 60).
 */
export const calculateCompositeScore = (
  input: CompositeScoreInput,
): CompositeScoreResult => {
  const marketPoints = MARKET_TIER_POINTS[input.marketTier] ?? 0;
  const { driverFitPoints } = input;

  if (input.mode === 'route') {
    const compositeScore = marketPoints + driverFitPoints;
    return {
      cpmPoints: 0,
      marketPoints,
      driverFitPoints,
      compositeScore,
      scoreType: 'route',
      compositeLabel: getRouteModeLabel(compositeScore),
    };
  }

  const cpmPoints = scoreCpm(input.vehicleCpm, input.ratePerMile);
  const compositeScore = cpmPoints + marketPoints + driverFitPoints;

  return {
    cpmPoints,
    marketPoints,
    driverFitPoints,
    compositeScore,
    scoreType: 'full',
    compositeLabel: getFullModeLabel(compositeScore),
  };
};
