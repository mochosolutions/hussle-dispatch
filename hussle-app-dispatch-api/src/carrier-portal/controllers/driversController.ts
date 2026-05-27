import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors';
import type { PortalDriversService } from '../services/portalDriversService';

interface DriversControllerDeps {
  portalDriversService: PortalDriversService;
}

export interface PortalDriversControllers {
  saveDrivers: RequestHandler;
}

interface DriverEntry {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  payType?: string;
  payRate?: number;
}

export const createDriversControllers = (
  deps: DriversControllerDeps,
): PortalDriversControllers => ({
  saveDrivers: async (req: Request, res: Response): Promise<void> => {
    const portalContext = req.carrierPortal;

    if (!portalContext) {
      throw new UnauthorizedError('Carrier portal context is required');
    }

    const { hasAdditionalDrivers, drivers } = req.body as {
      hasAdditionalDrivers: boolean;
      drivers?: DriverEntry[];
    };

    const result = await deps.portalDriversService.saveDrivers({
      carrierId: portalContext.carrierId,
      hasAdditionalDrivers,
      drivers,
    });

    sendSingle(res, result, 200);
  },
});
