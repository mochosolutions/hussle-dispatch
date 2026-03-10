// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type EquipmentType = 'DV' | 'RF' | 'FB' | 'SD';

export type SourceType = 'DAT' | 'Bulk' | 'Manual';

export type ScoreTier = 'All' | 'Elite' | 'Strong' | 'Fair' | 'Weak';

export type MarketStrength = 'Hot' | 'Balanced' | 'Soft' | 'Dead';

export type ChainType = '2-step' | '3-step';

export type LoadingState = 'Idle' | 'Pending' | 'Fulfilled' | 'Rejected';

// ---------------------------------------------------------------------------
// Score & Market
// ---------------------------------------------------------------------------

export interface TruckScore {
  vehicleId: string;
  unitNumber: string;
  driverName: string | null;
  composite: number;
  cpm: number;
  market: number;
  fit: number;
  minBookRate: number | null;
}

export interface ScoreBreakdown {
  cpm: number;
  market: number;
  driverFit: number;
}

export interface ChainLeg {
  origin: string;
  destination: string;
  miles: number;
  rate: number | null;
}

export interface ChainResult {
  chainScore: number;
  chainType: ChainType;
  legs: ChainLeg[];
  roundTripProfitability: number | null;
  dailyRevenue: number | null;
  weeklyGross: number | null;
}

// ---------------------------------------------------------------------------
// Feed Item (main entity)
// ---------------------------------------------------------------------------

export interface LoadSource {
  id: string;
  name: string;
  type: SourceType;
  dateAdded: string;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface LoadCarrier {
  id: string;
  name: string;
}

export interface LoadCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface LoadMarket {
  city: string;
  score: number;
}

export interface LoadIntelFeedItem {
  id: string;
  externalId?: string;
  score: number;
  scoreMode: 'star' | 'diamond';
  scoreBreakdown: ScoreBreakdown;
  chainScore: number | null;
  chainCount: number;
  chain: ChainResult | null;
  status: string;
  rate: number | null;
  minBookRate: number | null;
  miles: number;
  equipmentType: EquipmentType;
  source: LoadSource;
  origin: Location;
  destination: Location;
  carrier: LoadCarrier;
  customer: LoadCustomer;
  market: LoadMarket;
  destinationMarket: LoadMarket;
  marketStrength: MarketStrength;
  pickupStops: number;
  dropStops: number;
  pickupDate: string;
  vsMinimum: number | null;
  bestTruck: TruckScore | null;
  truckBreakdown: TruckScore[];
}

// ---------------------------------------------------------------------------
// Filters & Stats
// ---------------------------------------------------------------------------

export interface FeedFilters {
  scoreTier: ScoreTier;
  equipmentTypes: EquipmentType[];
  originState: string;
  destinationState: string;
  marketStrength: MarketStrength | 'All';
  hasRate: 'yes' | 'no' | 'all';
  source: SourceType | 'All';
  search: string;
  vehicleId: string | null;
}

export interface FeedStats {
  totalLoads: number;
  sourceCount: number;
  sourceCounts: Record<SourceType, number>;
  avgScore: number;
}

export type FeedSortBy =
  | 'score'
  | 'chainScore'
  | 'rate'
  | 'miles'
  | 'pickupDate';

// ---------------------------------------------------------------------------
// Feed State
// ---------------------------------------------------------------------------

export interface IntelPageState {
  feedItems: LoadIntelFeedItem[];
  filters: FeedFilters;
  sortBy: FeedSortBy;
  stats: FeedStats | null;
  page: number;
  hasMore: boolean;
  loading: Record<string, LoadingState>;
  error: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Manual Entry
// ---------------------------------------------------------------------------

export interface ManualEntryInput {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  pickupDate: string;
  equipmentType: EquipmentType;
  rate?: number;
  loadedMiles?: number;
  brokerName?: string;
}

// ---------------------------------------------------------------------------
// Book Load / Book Chain payloads
// ---------------------------------------------------------------------------

export interface BookLoadResult {
  loadId: string;
  prefill: {
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    rate: number | null;
    miles: number | null;
    equipmentType: string;
    brokerName: string | null;
    pickupDate: string | null;
    minBookRate: number | null;
  };
}

export interface BookChainResult {
  loadId: string;
  outboundPrefill: BookLoadResult['prefill'];
  backhaulData: {
    route: string;
    rate: number | null;
    brokerName: string | null;
    pickupDate: string | null;
  };
}

// ---------------------------------------------------------------------------
// Backward-compatible aliases
// ---------------------------------------------------------------------------

/** @deprecated Use LoadIntelFeedItem instead */
export type MockLoad = LoadIntelFeedItem;

/** @deprecated Use Location instead */
export interface MockDriver {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  avatarColor: string;
  currentCity: string;
  currentState: string;
}

export interface Stop {
  id: string;
  type: 'pickup' | 'dropoff';
  location: Location;
  commodity: string;
  weight: number | null;
}

export interface WorkspaceRoute {
  stops: Stop[];
  totalMiles: number;
  totalWeight: number;
  originMarket: LoadMarket;
  destinationMarket: LoadMarket;
}

export interface LoadFilters {
  score: ScoreTier;
  equipment: 'All' | EquipmentType;
  source: 'All' | SourceType;
}
