import type { Request, Response } from 'express';
import type { OnboardingSession, Carrier } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface SessionService {
  getOrCreate(carrierId: string): Promise<OnboardingSession>;
  saveAnswer(
    carrierId: string,
    input: { questionId: string; value: Prisma.InputJsonValue; phase?: number },
  ): Promise<OnboardingSession>;
  complete(carrierId: string): Promise<OnboardingSession>;
}

interface CarrierQueryPort {
  findById(id: string): Promise<Carrier | null>;
}

interface SessionControllerDeps {
  sessionService: SessionService;
  carrierQuery: CarrierQueryPort;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

export const createSessionControllers = (deps: SessionControllerDeps) => ({
  getSession: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const session = await deps.sessionService.getOrCreate(carrierId);
    const carrier = await deps.carrierQuery.findById(carrierId);
    const carrierSummary = carrier
      ? {
          id: carrier.id,
          name: carrier.name,
          email: carrier.email,
          phone: carrier.phone,
          status: carrier.status,
          type: carrier.type,
        }
      : null;
    sendSingle(res, { session, carrier: carrierSummary });
  },

  saveAnswer: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const { questionId, value, phase } = req.body;
    const session = await deps.sessionService.saveAnswer(carrierId, {
      questionId,
      value,
      phase,
    });
    sendSingle(res, session);
  },

  completeSession: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const session = await deps.sessionService.complete(carrierId);
    sendSingle(res, session);
  },
});
