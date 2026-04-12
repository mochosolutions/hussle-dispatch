import type { Request, Response } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface CarrierSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  onboardingStatus: string;
  type: string;
}

interface SaveCompanyFields {
  name: string;
  mcNumber?: string;
  dotNumber?: string;
  ein?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  factoringCompanyName?: string;
  factoringCompanyEmail?: string;
  factoringSubmissionMethod?: string;
  factoringAdvanceRate?: number;
  factoringFeePercent?: number;
  fuelCardProviders?: string[];
  howFoundUs?: string;
}

// Note: primaryContactName/Phone/Email are still accepted from the form.
// The service creates/updates a Contact record and sets primaryContactId on the carrier.

interface CompanyService {
  saveCompany(carrierId: string, fields: SaveCompanyFields): Promise<CarrierSummary>;
}

interface CompanyControllerDeps {
  companyService: CompanyService;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

export const createCompanyControllers = (deps: CompanyControllerDeps) => ({
  saveCompany: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const result = await deps.companyService.saveCompany(carrierId, req.body);
    sendSingle(res, result);
  },
});
