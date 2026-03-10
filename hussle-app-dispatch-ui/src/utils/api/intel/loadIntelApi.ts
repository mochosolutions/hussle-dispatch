import axiosInstance from 'utils/axios';
import type {
  LoadIntelFeedItem,
  FeedFilters,
  FeedStats,
  ChainResult,
  BookLoadResult,
  BookChainResult,
  ManualEntryInput,
} from 'features/loadintelligence/types';

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

interface GetLoadIntelResponse {
  data: LoadIntelFeedItem;
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

  const response = await axiosInstance.get<GetFeedResponse>('/load-intel/feed', { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// Single load intel
// ---------------------------------------------------------------------------

export const getLoadIntel = async (id: string): Promise<{ item: LoadIntelFeedItem }> => {
  const response = await axiosInstance.get<GetLoadIntelResponse>(`/load-intel/${id}`);
  return { item: response.data.data };
};

// ---------------------------------------------------------------------------
// Chains
// ---------------------------------------------------------------------------

export const getChains = async (
  id: string,
  vehicleId?: string,
): Promise<{ chains: ChainResult[] }> => {
  const params = vehicleId ? { vehicleId } : {};
  const response = await axiosInstance.get<GetChainsResponse>(
    `/load-intel/${id}/chains`,
    { params },
  );
  return { chains: response.data.data };
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
): Promise<{ item: LoadIntelFeedItem }> => {
  const response = await axiosInstance.post<ManualEntryResponse>('/load-intel/manual', data);
  return { item: response.data.data };
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
