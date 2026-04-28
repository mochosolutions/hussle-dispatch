import type { Request, Response } from 'express';
import type { Logger } from '@/shared/utils/logger';
import type { TrackingTokenService } from '../../notifications/services/trackingTokenService';
import type { DriverPortalLoadQueryPort } from '../types/driverPortalTypes';
import { ValidationError } from '@/shared/errors';
import { sendSingle } from '@/shared/responseEnvelope';

interface GetDriverPortalLinkControllerDeps {
  loadQuery: DriverPortalLoadQueryPort;
  trackingTokenService: TrackingTokenService;
  logger: Logger;
  trackingBaseUrl: string;
}

const DISPATCHED_OR_LATER = [
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'INVOICE_PENDING',
  'INVOICED',
  'PAID',
];

/**
 * Returns the driver portal URL for a load. Reuses the same token as the
 * Send Driver Link SMS flow (`getOrCreateDriverToken`) so the dispatcher
 * can copy a link without sending an SMS.
 *
 * Auth: ADMIN/DISPATCHER only — wired via `requireAuth` + `requireRole`
 * in the route layer (mirrors `sendDriverLink`).
 */
export const createGetDriverPortalLinkController = (deps: GetDriverPortalLinkControllerDeps) =>
  async (req: Request<{ loadId: string }>, res: Response): Promise<void> => {
    const { loadId } = req.params;

    const loadSummary = await deps.loadQuery.findLoadForDriverPortal(loadId);

    if (loadSummary === null) {
      throw new ValidationError('Load not found');
    }

    if (!DISPATCHED_OR_LATER.includes(loadSummary.status)) {
      throw new ValidationError('Load must be dispatched before generating a driver link');
    }

    const tokenRecord = await deps.trackingTokenService.getOrCreateDriverToken(loadId);
    const portalUrl = `${deps.trackingBaseUrl}/driver-portal/${tokenRecord.token}`;

    deps.logger.info('Driver portal link issued', { loadId });

    sendSingle(res, { url: portalUrl });
  };
