import type { LoadTrackingToken, TrackingTokenType } from '@prisma/client';

export type TrackingTokenRecord = LoadTrackingToken;

export interface CreateTrackingTokenInput {
  loadId: string;
  expiresInHours?: number;
}

export interface TrackingTokenRepoPort {
  create(input: { loadId: string; token: string; expiresAt: Date; type?: TrackingTokenType }): Promise<TrackingTokenRecord>;
  findByToken(token: string): Promise<TrackingTokenRecord | null>;
  findActiveByLoadId(loadId: string, type?: TrackingTokenType): Promise<TrackingTokenRecord | null>;
  revoke(id: string): Promise<void>;
}

export interface TrackingLoadSummary {
  loadNumber: string;
  status: string;
  originCity: string | null;
  originState: string | null;
  destinationCity: string | null;
  destinationState: string | null;
  eta: string | null;
  lastCheckCallLocation: string | null;
  lastCheckCallTime: string | null;
}

export interface TrackingLoadQueryPort {
  findTrackingSummary(loadId: string): Promise<TrackingLoadSummary | null>;
}
