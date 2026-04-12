export type LoadBoardSource = 'relay' | 'dat';

export interface StagedLoad {
  id: string;
  source: LoadBoardSource;
  sourceId: string;
  payout: number | null;
  ratePerMile: number | null;
  totalMiles: number | null;
  deadheadMiles: number | null;
  loadedMiles: number | null;
  equipmentType: string | null;
  equipmentTypeRaw: string | null;
  commodity: string | null;
  isTeamDriver: boolean;
  workType: string | null;
  loadType: string | null;
  totalDuration: number | null;
  firstPickupTime: string | null;
  lastDeliveryTime: string | null;
  originCity: string | null;
  originState: string | null;
  originLat: number | null;
  originLng: number | null;
  destCity: string | null;
  destState: string | null;
  destLat: number | null;
  destLng: number | null;
  stopCount: number | null;
  costBreakdown: Record<string, number> | null;
  tags: string[] | null;
  rawData: Record<string, unknown>;
  ingestedAt: string;
}

export interface FeedMeta {
  total: number;
  sources: Record<string, number>;
  lastUpdated: Record<string, string>;
}

export interface LoadBoardFeedResponse {
  data: StagedLoad[];
  meta: FeedMeta;
}
