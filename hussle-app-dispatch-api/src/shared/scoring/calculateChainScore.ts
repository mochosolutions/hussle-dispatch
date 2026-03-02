import { SCORING_WEIGHTS } from '../constants/scoringWeights';

const MAX_PROFITABILITY_POINTS = SCORING_WEIGHTS.chain.chainProfitability;
const MAX_POSITIONING_POINTS = SCORING_WEIGHTS.chain.returnPositioning;
const MAX_EFFICIENCY_POINTS = SCORING_WEIGHTS.chain.timeEfficiency;

/**
 * Profit margin thresholds for chain profitability scoring.
 * Margin = roundTripProfit / roundTripRevenue.
 */
const PROFIT_MARGIN_EXCELLENT = 0.35;
const PROFIT_MARGIN_GOOD = 0.20;
const PROFIT_MARGIN_FAIR = 0.10;

/**
 * Daily revenue utilization thresholds ($ per day).
 * Higher daily revenue = better time efficiency score.
 */
const DRU_EXCELLENT = 1500;
const DRU_GOOD = 1000;
const DRU_FAIR = 600;

/**
 * Miles from home after return load thresholds for positioning score.
 */
const POSITIONING_CLOSE_MILES = 200;
const POSITIONING_FAR_MILES = 1000;

export interface ChainScoreInput {
  outboundRate: number;
  outboundMiles: number;
  returnRate: number;
  returnMiles: number;
  totalTripDays: number;
  milesFromHomeAfterReturn: number;
  homeBase: string;
  returnDropState: string;
  preferredLanes: string[];
  vehicleCpmPerDay: number;
}

export interface ChainScoreResult {
  chainProfitabilityPoints: number;
  returnPositioningPoints: number;
  timeEfficiencyPoints: number;
  chainScore: number;
  chainLabel: string;
  roundTripRevenue: number;
  roundTripProfit: number;
  chainRPM: number;
  dailyRevenueUtilization: number;
  projectedWeeklyGross: number;
}

/**
 * Scores chain profitability (0-40) based on profit margin percentage.
 */
const scoreProfitability = (profit: number, revenue: number): number => {
  if (revenue <= 0) return 0;

  const margin = profit / revenue;

  if (margin >= PROFIT_MARGIN_EXCELLENT) return MAX_PROFITABILITY_POINTS;
  if (margin >= PROFIT_MARGIN_GOOD) {
    const progress = (margin - PROFIT_MARGIN_GOOD) / (PROFIT_MARGIN_EXCELLENT - PROFIT_MARGIN_GOOD);
    return Math.round(20 + progress * 20);
  }
  if (margin >= PROFIT_MARGIN_FAIR) {
    const progress = (margin - PROFIT_MARGIN_FAIR) / (PROFIT_MARGIN_GOOD - PROFIT_MARGIN_FAIR);
    return Math.round(progress * 20);
  }
  if (margin > 0) return Math.max(0, Math.round(margin * 100));

  return 0;
};

/**
 * Scores return positioning (0-35) based on miles from home and preferred lane match.
 */
const scoreReturnPositioning = (
  milesFromHome: number,
  returnDropState: string,
  preferredLanes: string[],
): number => {
  const isPreferredDrop = preferredLanes.includes(returnDropState);

  if (isPreferredDrop && milesFromHome <= POSITIONING_CLOSE_MILES) {
    return MAX_POSITIONING_POINTS;
  }

  if (milesFromHome <= POSITIONING_CLOSE_MILES) {
    return Math.round(MAX_POSITIONING_POINTS * 0.85);
  }

  if (milesFromHome >= POSITIONING_FAR_MILES) {
    return isPreferredDrop ? Math.round(MAX_POSITIONING_POINTS * 0.3) : 0;
  }

  // Linear decay between close and far thresholds
  const distanceRatio =
    (milesFromHome - POSITIONING_CLOSE_MILES) /
    (POSITIONING_FAR_MILES - POSITIONING_CLOSE_MILES);
  const basePoints = Math.round(MAX_POSITIONING_POINTS * (1 - distanceRatio) * 0.85);

  return isPreferredDrop ? Math.min(MAX_POSITIONING_POINTS, Math.round(basePoints * 1.15)) : basePoints;
};

/**
 * Scores time efficiency (0-25) based on daily revenue utilization.
 */
const scoreTimeEfficiency = (dailyRevenueUtilization: number): number => {
  if (dailyRevenueUtilization >= DRU_EXCELLENT) return MAX_EFFICIENCY_POINTS;
  if (dailyRevenueUtilization >= DRU_GOOD) {
    const progress = (dailyRevenueUtilization - DRU_GOOD) / (DRU_EXCELLENT - DRU_GOOD);
    return Math.round(15 + progress * 10);
  }
  if (dailyRevenueUtilization >= DRU_FAIR) {
    const progress = (dailyRevenueUtilization - DRU_FAIR) / (DRU_GOOD - DRU_FAIR);
    return Math.round(progress * 15);
  }

  return 0;
};

const getChainLabel = (score: number): string => {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Marginal';
  return 'Pass';
};

/**
 * Calculates a chain (round-trip) load score combining profitability,
 * return positioning, and time efficiency.
 *
 * Chain Profitability (0-40) + Return Positioning (0-35) + Time Efficiency (0-25) = 0-100.
 */
export const calculateChainScore = (input: ChainScoreInput): ChainScoreResult => {
  const {
    outboundRate,
    outboundMiles,
    returnRate,
    returnMiles,
    totalTripDays,
    milesFromHomeAfterReturn,
    returnDropState,
    preferredLanes,
    vehicleCpmPerDay,
  } = input;

  const roundTripRevenue = outboundRate + returnRate;
  const totalVehicleCost = vehicleCpmPerDay * totalTripDays;
  const roundTripProfit = roundTripRevenue - totalVehicleCost;
  const totalMiles = outboundMiles + returnMiles;
  const chainRPM = totalMiles > 0 ? roundTripRevenue / totalMiles : 0;
  const dailyRevenueUtilization = totalTripDays > 0 ? roundTripRevenue / totalTripDays : 0;
  const projectedWeeklyGross = dailyRevenueUtilization * 7;

  const chainProfitabilityPoints = scoreProfitability(roundTripProfit, roundTripRevenue);
  const returnPositioningPoints = scoreReturnPositioning(
    milesFromHomeAfterReturn,
    returnDropState,
    preferredLanes,
  );
  const timeEfficiencyPoints = scoreTimeEfficiency(dailyRevenueUtilization);

  const chainScore = chainProfitabilityPoints + returnPositioningPoints + timeEfficiencyPoints;

  return {
    chainProfitabilityPoints,
    returnPositioningPoints,
    timeEfficiencyPoints,
    chainScore,
    chainLabel: getChainLabel(chainScore),
    roundTripRevenue,
    roundTripProfit,
    chainRPM,
    dailyRevenueUtilization,
    projectedWeeklyGross,
  };
};
