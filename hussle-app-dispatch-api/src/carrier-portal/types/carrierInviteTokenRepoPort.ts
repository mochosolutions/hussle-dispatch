import type { CarrierInviteToken } from '@prisma/client';

export interface CreateCarrierInviteTokenInput {
  carrierId: string;
  organizationId: string;
  token: string;
  expiresAt: Date;
}

export interface CarrierInviteTokenRepoPort {
  findByToken(token: string): Promise<CarrierInviteToken | null>;
  create(data: CreateCarrierInviteTokenInput): Promise<CarrierInviteToken>;
  revokeByCarrierId(carrierId: string): Promise<void>;
}
