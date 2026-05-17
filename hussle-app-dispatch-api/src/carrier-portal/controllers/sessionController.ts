import type { Request, Response } from 'express';
import type { OnboardingSession, Carrier, Prisma } from '@prisma/client';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors/commonErrors';

interface SessionService {
  getOrCreate(carrierId: string): Promise<OnboardingSession>;
  saveAnswer(
    carrierId: string,
    input: { questionId: string; value: Prisma.InputJsonValue; phase?: number },
  ): Promise<OnboardingSession>;
  submitStep(
    carrierId: string,
    input: { stepId: string; answers: Record<string, Prisma.InputJsonValue> },
  ): Promise<OnboardingSession>;
  complete(carrierId: string): Promise<OnboardingSession>;
}

interface CarrierQueryPort {
  findById(id: string): Promise<Carrier | null>;
}

interface InvitationQueryPort {
  findActiveOrganizationNameByCarrierId(carrierId: string): Promise<string | null>;
}

interface AgreementSnapshotPort {
  findLatestForCarrier(
    carrierId: string,
  ): Promise<{ id: string; status: string; embedUrl: string | null } | null>;
}

interface SessionControllerDeps {
  sessionService: SessionService;
  carrierQuery: CarrierQueryPort;
  invitationQuery: InvitationQueryPort;
  agreementQuery: AgreementSnapshotPort;
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
    const [session, carrier, organizationName, agreement] = await Promise.all([
      deps.sessionService.getOrCreate(carrierId),
      deps.carrierQuery.findById(carrierId),
      deps.invitationQuery.findActiveOrganizationNameByCarrierId(carrierId),
      deps.agreementQuery.findLatestForCarrier(carrierId),
    ]);

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

    const signedFieldsLocked = carrier ? carrier.dispatchAgreementSignedAt !== null : false;

    sendSingle(res, {
      session,
      carrier: carrierSummary,
      agreement: agreement ? { ...agreement, signedFieldsLocked } : null,
      invitation: {
        email: carrier?.email ?? null,
        phone: carrier?.phone ?? null,
        organizationName,
      },
    });
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

  submitStep: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const { stepId, answers } = req.body as {
      stepId: string;
      answers: Record<string, Prisma.InputJsonValue>;
    };
    const session = await deps.sessionService.submitStep(carrierId, { stepId, answers });
    sendSingle(res, session);
  },

  completeSession: async (req: Request, res: Response) => {
    const carrierId = getCarrierId(req);
    const session = await deps.sessionService.complete(carrierId);
    sendSingle(res, session);
  },
});
