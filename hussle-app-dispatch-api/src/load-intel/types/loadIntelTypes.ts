import type { EquipmentType } from '../../shared/constants/equipmentTypes';
import type { LoadSource } from '../../shared/constants/loadSources';
import type { LoadChain } from './backhaulTypes';

/**
 * Geographic location with city and state.
 */
export interface GeoPoint {
  city: string;
  state: string;
}

/**
 * Broker information attached to a load intel payload.
 */
export interface BrokerInfo {
  name: string;
  mc: string;
}

/**
 * Inbound payload shape for a single load intel record.
 * Represents a load opportunity scraped, emailed, or manually entered.
 */
export interface LoadIntelPayload {
  source: LoadSource;
  origin: GeoPoint;
  dest: GeoPoint;
  pickupDate: string;
  deliveryDate?: string;
  equipmentType: EquipmentType;
  rate?: number;
  loadedMiles?: number;
  broker?: BrokerInfo;
  brokerPhone?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Per-truck score for a load intel record.
 */
export interface TruckScore {
  vehicleId: string;
  unitNumber: string;
  driverName: string;
  compositeScore: number;
  cpmScore: number;
  marketScore: number;
  driverFitScore: number;
  minBookRate: number;
  mode: 'full' | 'route';
}

/**
 * Stored load intel record in Redis with computed scores.
 */
export interface LoadIntelRedis {
  payload: LoadIntelPayload;
  loadHash: string;
  orgId: string;
  scores: TruckScore[];
  bestScore: number;
  createdAt: string;
  ttlSeconds: number;
  chainScore?: number;
  chainCount?: number;
  chains?: LoadChain[];
}

/**
 * Result of ingesting a single load intel payload.
 */
export interface IngestResult {
  loadHash: string;
  scores: TruckScore[];
  isNew: boolean;
}

/**
 * Result of ingesting a batch of load intel payloads.
 */
export interface IngestBatchResult {
  total: number;
  ingested: number;
  duplicates: number;
  invalid: number;
  results: IngestResult[];
}

/**
 * Query parameters for the load intel feed endpoint.
 */
export interface FeedQueryParams {
  page: number;
  limit: number;
  score?: 'high' | 'medium' | 'low';
  hasRate?: boolean;
  equipmentType?: EquipmentType;
  source?: LoadSource;
  includeChains?: boolean;
}

/**
 * Market data snapshot stored in Redis.
 */
export interface MarketSnapshot {
  state: string;
  city: string;
  loadToTruckRatio: number;
  tier: string;
  tierPoints: number;
  storedAt: string;
}

/**
 * Score tier thresholds for feed filtering.
 */
export const SCORE_TIERS = Object.freeze({
  HIGH_MIN: 70,
  MEDIUM_MIN: 40,
} as const);

/**
 * Market tier thresholds based on load-to-truck ratio.
 */
export const MARKET_RATIO_THRESHOLDS = Object.freeze({
  HOT: 3.0,
  BALANCED: 1.5,
  SOFT: 0.8,
} as const);

/**
 * Points awarded per market ratio tier.
 */
export const MARKET_RATIO_POINTS = Object.freeze({
  HOT: 30,
  BALANCED: 22,
  SOFT: 10,
  DEAD: 0,
  NO_DATA: 15,
} as const);

/**
 * Simplified vehicle+driver data needed for scoring.
 */
export interface FleetUnit {
  vehicleId: string;
  unitNumber: string;
  driverName: string;
  driverId: string;
  vehicleCpm: number;
  monthlyMilesTarget: number;
  homeBaseCity: string;
  homeBaseState: string;
  currentCity: string;
  currentState: string;
  preferredLanes: string[];
  noGoZones: string[];
  maxDaysOut: number;
  currentDaysOut: number;
  equipmentType: EquipmentType;
  dispatchFeePercent: number;
  profitMargin: number;
}
