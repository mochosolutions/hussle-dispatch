import type { LoadIntelRedis } from '../../types/loadIntelTypes';

export interface LoadIntelResponse {
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
  scores: {
    vehicleId: string;
    unitNumber: string;
    driverName: string;
    compositeScore: number;
    cpmScore: number;
    marketScore: number;
    driverFitScore: number;
    minBookRate: number;
    mode: string;
  }[];
  chainScore?: number;
  chainCount?: number;
  chains?: {
    steps: {
      loadHash: string;
      origin: { city: string; state: string };
      dest: { city: string; state: string };
      rate?: number;
      loadedMiles?: number;
      compositeScore: number;
    }[];
    totalMiles: number;
    totalRate: number;
    chainScore: number;
  }[];
}

export const loadIntelTransformer = (record: LoadIntelRedis): LoadIntelResponse => ({
  loadHash: record.loadHash,
  orgId: record.orgId,
  bestScore: record.bestScore,
  createdAt: record.createdAt,
  payload: {
    source: record.payload.source,
    origin: record.payload.origin,
    dest: record.payload.dest,
    pickupDate: record.payload.pickupDate,
    deliveryDate: record.payload.deliveryDate,
    equipmentType: record.payload.equipmentType,
    rate: record.payload.rate,
    loadedMiles: record.payload.loadedMiles,
    broker: record.payload.broker,
    brokerPhone: record.payload.brokerPhone,
    weight: record.payload.weight,
  },
  scores: record.scores.map((s) => ({
    vehicleId: s.vehicleId,
    unitNumber: s.unitNumber,
    driverName: s.driverName,
    compositeScore: s.compositeScore,
    cpmScore: s.cpmScore,
    marketScore: s.marketScore,
    driverFitScore: s.driverFitScore,
    minBookRate: s.minBookRate,
    mode: s.mode,
  })),
  chainScore: record.chainScore,
  chainCount: record.chainCount,
  chains: record.chains?.map((chain) => ({
    steps: chain.steps.map((s) => ({
      loadHash: s.loadHash,
      origin: s.origin,
      dest: s.dest,
      rate: s.rate,
      loadedMiles: s.loadedMiles,
      compositeScore: s.compositeScore,
    })),
    totalMiles: chain.totalMiles,
    totalRate: chain.totalRate,
    chainScore: chain.chainScore,
  })),
});
