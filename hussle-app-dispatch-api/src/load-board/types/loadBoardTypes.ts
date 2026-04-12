export type LoadSource = 'relay' | 'dat';

export type EquipmentTypeApp =
  | 'DRY_VAN'
  | 'REEFER'
  | 'FLATBED'
  | 'STEP_DECK'
  | 'BOX_TRUCK'
  | 'HOTSHOT'
  | 'POWER_ONLY';

export interface StagedLoad {
  id: string;
  source: LoadSource;
  sourceId: string;
  payout: number | null;
  ratePerMile: number | null;
  totalMiles: number | null;
  deadheadMiles: number | null;
  loadedMiles: number | null;
  equipmentType: EquipmentTypeApp | null;
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

export type IngestPayload = {
  source: LoadSource;
  loads: Record<string, unknown>[];
};

export type IngestServiceInput = {
  organizationId: string;
  source: LoadSource;
  loads: Record<string, unknown>[];
};

export type FeedServiceInput = {
  organizationId: string;
  source?: LoadSource;
};

export type FeedDetailInput = {
  organizationId: string;
  id: string;
};

export type ClearSourceInput = {
  organizationId: string;
  source: LoadSource;
};

export type FeedMeta = {
  total: number;
  sources: Record<string, number>;
  lastUpdated: Record<string, string>;
};

export type FeedResponse = {
  data: StagedLoad[];
  meta: FeedMeta;
};
