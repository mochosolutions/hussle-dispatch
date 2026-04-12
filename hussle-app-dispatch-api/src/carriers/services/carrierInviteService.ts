import crypto from 'node:crypto';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { CarrierRepositoryPort, UpdateCarrierInput } from '../types/carrierTypes';
import type { CarrierInviteTokenRepoPort } from '@/carrier-portal/types/carrierInviteTokenRepoPort';
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';

const INVITE_TOKEN_BYTES = 32;
const INVITE_EXPIRY_DAYS = 7;

interface SendInviteInput {
  carrierId: string;
  organizationId: string;
  userId: string;
  message?: string;
}

interface SendInviteResult {
  inviteSentAt: Date;
  tokenExpiresAt: Date;
}

interface CarrierInviteServiceDeps {
  carrierRepo: CarrierRepositoryPort;
  inviteTokenRepo: CarrierInviteTokenRepoPort;
  eventBus: EventBus;
}

const generateInviteToken = () => {
  const token = crypto.randomBytes(INVITE_TOKEN_BYTES).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return { token, now, expiresAt };
};

const issueInvite = async (
  deps: CarrierInviteServiceDeps,
  input: SendInviteInput,
  carrier: { name: string; email: string; phone?: string | null },
): Promise<SendInviteResult> => {
  const { token, now, expiresAt } = generateInviteToken();

  await deps.inviteTokenRepo.revokeByCarrierId(input.carrierId);

  await deps.inviteTokenRepo.create({
    carrierId: input.carrierId,
    organizationId: input.organizationId,
    token,
    expiresAt,
  });

  await deps.carrierRepo.update(input.carrierId, {
    inviteSentAt: now,
  } satisfies UpdateCarrierInput);

  await deps.eventBus.publish('carrier.invited', {
    carrierId: input.carrierId,
    organizationId: input.organizationId,
    carrierName: carrier.name,
    carrierEmail: carrier.email,
    carrierPhone: carrier.phone,
    inviteToken: token,
    invitedByUserId: input.userId,
  });

  return { inviteSentAt: now, tokenExpiresAt: expiresAt };
};

export const createCarrierInviteService = (deps: CarrierInviteServiceDeps) => ({
  sendInvite: async (input: SendInviteInput): Promise<SendInviteResult> => {
    const carrier = await deps.carrierRepo.findById(input.carrierId, input.organizationId);

    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    if (!carrier.email) {
      throw new ValidationError('Carrier must have an email address');
    }

    if (carrier.status === 'ACTIVE' && carrier.onboardingStatus === 'APPROVED') {
      throw new ConflictError('Carrier is already active');
    }

    if (
      carrier.onboardingStatus === 'COMPLETED' ||
      carrier.onboardingStatus === 'APPROVED'
    ) {
      throw new ConflictError('Carrier onboarding is already completed or approved');
    }

    await deps.carrierRepo.update(input.carrierId, {
      onboardingStatus: 'NOT_STARTED',
      entryMethod: 'INVITE',
    } satisfies UpdateCarrierInput);

    return issueInvite(deps, input, {
      name: carrier.name,
      email: carrier.email,
      phone: carrier.phone,
    });
  },

  resendInvite: async (input: SendInviteInput): Promise<SendInviteResult> => {
    const carrier = await deps.carrierRepo.findById(input.carrierId, input.organizationId);

    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    if (!carrier.email) {
      throw new ValidationError('Carrier must have an email address');
    }

    if (carrier.status === 'ACTIVE') {
      throw new ConflictError('Carrier is already active');
    }

    return issueInvite(deps, input, {
      name: carrier.name,
      email: carrier.email,
      phone: carrier.phone,
    });
  },
});
