import crypto from 'node:crypto';
import { CarrierStatus } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { CarrierRepositoryPort, UpdateCarrierInput } from '../types/carrierTypes';
import type { CarrierInviteTokenRepoPort } from '@/carrier-portal/types/carrierInviteTokenRepoPort';
import type { CarrierAuditPort } from '../types/carrierAuditPort';
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import { assertTransition } from './carrierStateMachine';

const INVITE_TOKEN_BYTES = 32;
const INVITE_EXPIRY_DAYS = 7;

const RESEND_ALLOWED_STATUSES: readonly CarrierStatus[] = [
  CarrierStatus.INVITED,
  CarrierStatus.ONBOARDING,
  CarrierStatus.PENDING_APPROVAL,
];

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
  auditLog: CarrierAuditPort;
}

const generateInviteToken = () => {
  const token = crypto.randomBytes(INVITE_TOKEN_BYTES).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return { token, now, expiresAt };
};

interface InviteCarrierContext {
  id: string;
  status: CarrierStatus;
  name: string;
  email: string;
  phone?: string | null;
}

interface IssueParams {
  deps: CarrierInviteServiceDeps;
  input: SendInviteInput;
  carrier: InviteCarrierContext;
  token: string;
  expiresAt: Date;
}

const writeTokenAndPublish = async (params: IssueParams): Promise<void> => {
  const { deps, input, carrier, token, expiresAt } = params;
  await deps.inviteTokenRepo.revokeByCarrierId(input.carrierId);

  await deps.inviteTokenRepo.create({
    carrierId: input.carrierId,
    organizationId: input.organizationId,
    token,
    expiresAt,
  });

  await deps.eventBus.publish('carrier.invited', {
    carrierId: input.carrierId,
    organizationId: input.organizationId,
    carrierName: carrier.name,
    carrierEmail: carrier.email,
    carrierPhone: carrier.phone,
    inviteToken: token,
    invitedByUserId: input.userId,
  });
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

    assertTransition(carrier.status, CarrierStatus.INVITED);

    const { token, now, expiresAt } = generateInviteToken();
    const action =
      carrier.status === CarrierStatus.REJECTED ? 'CARRIER_REINVITED' : 'CARRIER_INVITED';

    await deps.carrierRepo.update(input.carrierId, input.organizationId, {
      inviteSentAt: now,
      entryMethod: 'INVITE',
      status: CarrierStatus.INVITED,
    } satisfies UpdateCarrierInput);

    await writeTokenAndPublish({
      deps,
      input,
      carrier: {
        id: carrier.id,
        status: carrier.status,
        name: carrier.name,
        email: carrier.email,
        phone: carrier.phone,
      },
      token,
      expiresAt,
    });

    await deps.auditLog
      .create(input.organizationId, {
        userId: input.userId,
        action,
        entityType: 'CARRIER',
        entityId: input.carrierId,
        changes: { status: { old: carrier.status, new: CarrierStatus.INVITED } },
        metadata: { tokenExpiresAt: expiresAt.toISOString() },
      })
      .catch(() => undefined);

    return { inviteSentAt: now, tokenExpiresAt: expiresAt };
  },

  resendInvite: async (input: SendInviteInput): Promise<SendInviteResult> => {
    const carrier = await deps.carrierRepo.findById(input.carrierId, input.organizationId);

    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }
    if (!carrier.email) {
      throw new ValidationError('Carrier must have an email address');
    }

    if (!RESEND_ALLOWED_STATUSES.includes(carrier.status)) {
      throw new ConflictError(
        `Cannot resend invite for carrier in status ${carrier.status}. Allowed: ${RESEND_ALLOWED_STATUSES.join(', ')}.`,
      );
    }

    const { token, now, expiresAt } = generateInviteToken();

    await deps.carrierRepo.update(input.carrierId, input.organizationId, {
      inviteSentAt: now,
    } satisfies UpdateCarrierInput);

    await writeTokenAndPublish({
      deps,
      input,
      carrier: {
        id: carrier.id,
        status: carrier.status,
        name: carrier.name,
        email: carrier.email,
        phone: carrier.phone,
      },
      token,
      expiresAt,
    });

    await deps.auditLog
      .create(input.organizationId, {
        userId: input.userId,
        action: 'CARRIER_INVITE_RESENT',
        entityType: 'CARRIER',
        entityId: input.carrierId,
        changes: null,
        metadata: { tokenExpiresAt: expiresAt.toISOString() },
      })
      .catch(() => undefined);

    return { inviteSentAt: now, tokenExpiresAt: expiresAt };
  },
});
