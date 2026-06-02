import { v4 as uuidv4 } from 'uuid';
import { BadRequestError } from '@mocho/common';

import { NotFoundError } from '@/shared/errors';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { DriverAuthRepoPort, DriverInviteTokenRepoPort } from '../types/driverAuthTypes';

export interface InviteDriverInput {
  driverId: string;
  organizationId: string;
  invitedByUserId: string;
}

export interface InviteDriverResult {
  driverId: string;
  token: string;
  setupUrl: string;
  expiresAt: Date;
  sentTo: { email: string | null; phone: string | null };
}

interface InviteDriverServiceDeps {
  driverAuthRepo: DriverAuthRepoPort;
  inviteTokenRepo: DriverInviteTokenRepoPort;
  frontendUrl: string;
  logger: Logger;
  eventBus: EventBus;
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Issues a driver setup invite by driverId. Business rules: the driver must
 * exist within the requesting org's managed carriers (org scoping) and must
 * have at least one contact method (email or phone) — otherwise the invite
 * cannot be delivered, so we reject with a validation error.
 *
 * DRIVER invites are intentionally NOT seat-gated: a driver is a first-class
 * portal user, not a billable membership seat.
 */
export const inviteDriverService = async (
  input: InviteDriverInput,
  deps: InviteDriverServiceDeps,
): Promise<InviteDriverResult> => {
  const driver = await deps.driverAuthRepo.findDriverAuthInfo(input.driverId);

  if (driver === null) {
    throw new NotFoundError('Driver not found.');
  }

  // Org scoping: the driver's managing org must match the requester's org.
  if (driver.managedByOrgId !== input.organizationId) {
    throw new NotFoundError('Driver not found.');
  }

  const hasContact =
    (driver.email !== null && driver.email !== '') ||
    (driver.phone !== null && driver.phone !== '');

  if (!hasContact) {
    throw new BadRequestError(
      'Driver must have an email or phone number before they can be invited.',
    );
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await deps.inviteTokenRepo.create({
    driverId: driver.id,
    organizationId: input.organizationId,
    token,
    expiresAt,
  });

  const setupUrl = `${deps.frontendUrl}/driver-portal/setup/${token}`;

  // Deliver the setup link via the existing notification channel (SMS preferred,
  // email fallback) — handled by the notification subscriber in the worker.
  // Fire-and-forget: invite issuance succeeds even if delivery is briefly down
  // (the dispatcher also receives setupUrl in the response as a manual fallback).
  deps.eventBus
    .publish('driver.invited', {
      driverId: driver.id,
      organizationId: input.organizationId,
      setupUrl,
      firstName: driver.firstName,
      email: driver.email,
      phone: driver.phone,
    })
    .catch((error: unknown) => {
      deps.logger.error('Failed to publish driver.invited event', {
        driverId: driver.id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  deps.logger.info('Driver invite issued', {
    driverId: driver.id,
    organizationId: input.organizationId,
    invitedByUserId: input.invitedByUserId,
  });

  return {
    driverId: driver.id,
    token,
    setupUrl,
    expiresAt,
    sentTo: { email: driver.email, phone: driver.phone },
  };
};
