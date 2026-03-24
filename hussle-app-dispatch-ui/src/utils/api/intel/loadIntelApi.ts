import axiosInstance from 'utils/axios';
import type {
  LoadIntelFeedItem,
  FeedFilters,
  FeedStats,
  ChainResult,
  BookLoadResult,
  BookChainResult,
  ManualEntryInput,
  TruckScore,
} from 'features/loadintelligence/types';

// ---------------------------------------------------------------------------
// Backend response shape (from loadIntelTransformer)
// ---------------------------------------------------------------------------

interface BackendTruckScore {
  vehicleId: string;
  unitNumber: string;
  driverName: string;
  compositeScore: number;
  cpmScore: number;
  marketScore: number;
  driverFitScore: number;
  minBookRate: number;
  mode: string;
}

interface BackendLoadIntelItem {
  loadHash: string;
  orgId: string;
  bestScore: number;
  createdAt: string;
  payload: {
    source: string;
    origin: { city: string; state: string };
    dest: { city: string; state: string };
    pickupDate: string;
    deliveryDate?: string;
    equipmentType: string;
    rate?: number;
    loadedMiles?: number;
    broker?: { name: string; mc: string };
    brokerPhone?: string;
    weight?: number;
  };
  scores: BackendTruckScore[];
}

// ---------------------------------------------------------------------------
// Mapping: backend → frontend
// ---------------------------------------------------------------------------

const mapTruckScore = (s: BackendTruckScore): TruckScore => ({
  vehicleId: s.vehicleId,
  unitNumber: s.unitNumber,
  driverName: s.driverName || null,
  composite: s.compositeScore,
  cpm: s.cpmScore,
  market: s.marketScore,
  fit: s.driverFitScore,
  minBookRate: s.minBookRate ?? null,
});

const mapLoadIntelResponse = (item: BackendLoadIntelItem): LoadIntelFeedItem => {
  const trucks = item.scores.map(mapTruckScore);
  const bestTruck = trucks.length > 0 ? trucks[0] : null;

  return {
    id: item.loadHash,
    score: item.bestScore,
    rate: item.payload.rate ?? null,
    minBookRate: bestTruck?.minBookRate ?? null,
    miles: item.payload.loadedMiles ?? 0,
    equipmentType: (item.payload.equipmentType || 'DV') as LoadIntelFeedItem['equipmentType'],
    origin: { city: item.payload.origin.city, state: item.payload.origin.state, country: '', zip: '' },
    destination: { city: item.payload.dest.city, state: item.payload.dest.state, country: '', zip: '' },
    pickupDate: item.payload.pickupDate,
    bestTruck,
    truckBreakdown: trucks,
    scoreBreakdown: bestTruck
      ? { cpm: bestTruck.cpm, market: bestTruck.market, driverFit: bestTruck.fit }
      : null,
    carrier: item.payload.broker
      ? { id: '', name: item.payload.broker.name }
      : null,
  };
};

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface GetFeedParams {
  page?: number;
  limit?: number;
  scoreTier?: string;
  equipmentTypes?: string[];
  originState?: string;
  destinationState?: string;
  marketStrength?: string;
  hasRate?: string;
  source?: string;
  search?: string;
  sortBy?: string;
  vehicleId?: string;
}

interface BackendGetFeedResponse {
  data: BackendLoadIntelItem[];
  stats: FeedStats;
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface GetFeedResponse {
  data: LoadIntelFeedItem[];
  stats: FeedStats;
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface BackendGetLoadIntelResponse {
  data: BackendLoadIntelItem;
}

interface GetChainsResponse {
  data: ChainResult[];
}

interface BookLoadResponse {
  data: BookLoadResult;
}

interface BookChainResponse {
  data: BookChainResult;
}

interface ManualEntryResponse {
  data: LoadIntelFeedItem;
}

interface MarketDataResponse {
  data: {
    city: string;
    state: string;
    score: number;
    avgRate: number | null;
    loadCount: number;
  };
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export const getFeed = async (
  filters: Partial<FeedFilters>,
  page = 1,
  limit = 25,
  sortBy = 'score',
): Promise<GetFeedResponse> => {
  const params: GetFeedParams = {
    page,
    limit,
    sortBy,
  };

  if (filters.scoreTier && filters.scoreTier !== 'All') {
    params.scoreTier = filters.scoreTier;
  }
  if (filters.equipmentTypes && filters.equipmentTypes.length > 0) {
    params.equipmentTypes = filters.equipmentTypes;
  }
  if (filters.originState) {
    params.originState = filters.originState;
  }
  if (filters.destinationState) {
    params.destinationState = filters.destinationState;
  }
  if (filters.marketStrength && filters.marketStrength !== 'All') {
    params.marketStrength = filters.marketStrength;
  }
  if (filters.hasRate && filters.hasRate !== 'all') {
    params.hasRate = filters.hasRate;
  }
  if (filters.source && filters.source !== 'All') {
    params.source = filters.source;
  }
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.vehicleId) {
    params.vehicleId = filters.vehicleId;
  }

  const response = await axiosInstance.get<BackendGetFeedResponse>('/load-intel/feed', { params });
  const backendData = response.data;

  return {
    data: backendData.data.map(mapLoadIntelResponse),
    stats: backendData.stats,
    meta: backendData.meta,
  };
};

// ---------------------------------------------------------------------------
// Single load intel
// ---------------------------------------------------------------------------

export const getLoadIntel = async (id: string): Promise<LoadIntelFeedItem> => {
  const response = await axiosInstance.get<BackendGetLoadIntelResponse>(`/load-intel/${id}`);
  return mapLoadIntelResponse(response.data.data);
};

// ---------------------------------------------------------------------------
// Chains
// ---------------------------------------------------------------------------

export const getChains = async (
  id: string,
  vehicleId?: string,
): Promise<ChainResult[]> => {
  const params = vehicleId ? { vehicleId } : {};
  const response = await axiosInstance.get<GetChainsResponse>(
    `/load-intel/${id}/chains`,
    { params },
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Book load
// ---------------------------------------------------------------------------

export const bookLoad = async (id: string): Promise<BookLoadResult> => {
  const response = await axiosInstance.post<BookLoadResponse>(`/load-intel/${id}/book`);
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Book chain
// ---------------------------------------------------------------------------

export const bookChain = async (id: string): Promise<BookChainResult> => {
  const response = await axiosInstance.post<BookChainResponse>(`/load-intel/${id}/book-chain`);
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Dismiss
// ---------------------------------------------------------------------------

export const dismiss = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/load-intel/${id}`);
};

// ---------------------------------------------------------------------------
// Manual entry
// ---------------------------------------------------------------------------

export const submitManualEntry = async (
  data: ManualEntryInput,
): Promise<LoadIntelFeedItem> => {
  const response = await axiosInstance.post<ManualEntryResponse>('/load-intel/manual', data);
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Market data
// ---------------------------------------------------------------------------

export const getMarketData = async (
  state: string,
  city: string,
): Promise<MarketDataResponse['data']> => {
  const response = await axiosInstance.get<MarketDataResponse>('/load-intel/backhaul', {
    params: { state, city },
  });
  return response.data.data;
};
