import { randomUUID } from 'crypto';
import { NotFoundError } from '@/shared/errors';
import type {
  TrackingTokenRepoPort,
  TrackingLoadQueryPort,
  TrackingTokenRecord,
  TrackingLoadSummary,
} from '../types/trackingTokenTypes';

const DEFAULT_EXPIRY_HOURS = 168; // 7 days

export interface TrackingTokenService {
  getOrCreate(loadId: string): Promise<TrackingTokenRecord>;
  getOrCreateDriverToken(loadId: string): Promise<TrackingTokenRecord>;
  getTrackingSummary(token: string): Promise<TrackingLoadSummary>;
  revoke(loadId: string): Promise<void>;
}

interface TrackingTokenServiceDeps {
  tokenRepo: TrackingTokenRepoPort;
  loadQuery: TrackingLoadQueryPort;
}

const createToken = async (
  loadId: string,
  type: 'CUSTOMER' | 'DRIVER',
  deps: TrackingTokenServiceDeps,
): Promise<TrackingTokenRecord> => {
  const existing = await deps.tokenRepo.findActiveByLoadId(loadId, type);

  if (existing !== null) {
    return existing;
  }

  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + DEFAULT_EXPIRY_HOURS);

  return deps.tokenRepo.create({ loadId, token, expiresAt, type });
};

export const createTrackingTokenService = (
  deps: TrackingTokenServiceDeps,
): TrackingTokenService => ({
  getOrCreate: async (loadId) => createToken(loadId, 'CUSTOMER', deps),

  getOrCreateDriverToken: async (loadId) => createToken(loadId, 'DRIVER', deps),

  getTrackingSummary: async (token) => {
    const tokenRecord = await deps.tokenRepo.findByToken(token);

    if (tokenRecord === null) {
      throw new NotFoundError('Tracking link not found.');
    }

    if (tokenRecord.revokedAt !== null) {
      throw new NotFoundError('Tracking link has been revoked.');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new NotFoundError('Tracking link has expired.');
    }

    const summary = await deps.loadQuery.findTrackingSummary(tokenRecord.loadId);

    if (summary === null) {
      throw new NotFoundError('Load not found.');
    }

    return summary;
  },

  revoke: async (loadId) => {
    const existing = await deps.tokenRepo.findActiveByLoadId(loadId);

    if (existing !== null) {
      await deps.tokenRepo.revoke(existing.id);
    }
  },
});
