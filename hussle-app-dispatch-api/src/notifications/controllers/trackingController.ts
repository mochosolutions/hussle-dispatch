import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { ValidationError } from '@/shared/errors';
import type { TrackingTokenService } from '../services/trackingTokenService';

const requireParam = (params: Record<string, string | undefined>, key: string): string => {
  const value = params[key];
  if (value === undefined || value.length === 0) {
    throw new ValidationError(`Missing required parameter: ${key}`);
  }
  return value;
};

export interface TrackingControllers {
  getTrackingSummary: RequestHandler;
  createToken: RequestHandler;
}

interface TrackingControllerDeps {
  trackingTokenService: TrackingTokenService;
}

export const createTrackingControllers = (
  deps: TrackingControllerDeps,
): TrackingControllers => ({
  getTrackingSummary: async (req: Request, res: Response): Promise<void> => {
    const token = requireParam(req.params, 'token');
    const summary = await deps.trackingTokenService.getTrackingSummary(token);
    sendSingle(res, summary);
  },

  createToken: async (req: Request, res: Response): Promise<void> => {
    const loadId = requireParam(req.params, 'loadId');
    const tokenRecord = await deps.trackingTokenService.getOrCreate(loadId);
    sendSingle(res, {
      id: tokenRecord.id,
      loadId: tokenRecord.loadId,
      token: tokenRecord.token,
      expiresAt: tokenRecord.expiresAt.toISOString(),
      createdAt: tokenRecord.createdAt.toISOString(),
    }, 201);
  },
});
