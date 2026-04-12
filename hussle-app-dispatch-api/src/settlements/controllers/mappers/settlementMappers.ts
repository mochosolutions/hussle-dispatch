import type { Request } from 'express';
import type { SettlementStatus } from '@prisma/client';
import type {
  GenerateSettlementInput,
  ListSettlementsInput,
  ApproveSettlementInput,
  PaySettlementInput,
  DisputeSettlementInput,
  CreateAdjustmentInput,
  UpdateAdjustmentInput,
  DeleteAdjustmentInput,
  SendSettlementInput,
} from '../../types/settlementTypes';

const getContext = (req: Request) => ({
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
});

export const generateSettlementMapper = (req: Request): GenerateSettlementInput => {
  const { organizationId } = getContext(req);
  const { carrierId, driverId, vehicleId, periodStart, periodEnd } = req.body;

  return {
    organizationId,
    carrierId,
    ...(driverId ? { driverId } : {}),
    ...(vehicleId ? { vehicleId } : {}),
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
  };
};

export const listSettlementsMapper = (req: Request): ListSettlementsInput => {
  const { organizationId } = getContext(req);
  const { status, carrierId, driverId, periodStart, periodEnd, skip, take } = req.query;

  return {
    organizationId,
    ...(status ? { status: status as SettlementStatus } : {}),
    ...(carrierId ? { carrierId: String(carrierId) } : {}),
    ...(driverId ? { driverId: String(driverId) } : {}),
    ...(periodStart ? { periodStart: new Date(String(periodStart)) } : {}),
    ...(periodEnd ? { periodEnd: new Date(String(periodEnd)) } : {}),
    skip: skip ? Number(skip) : 0,
    take: take ? Number(take) : 25,
  };
};

export const getSettlementMapper = (
  req: Request,
): { organizationId: string; settlementId: string } => {
  const { organizationId } = getContext(req);

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
  };
};

export const approveSettlementMapper = (req: Request): ApproveSettlementInput => {
  const { organizationId, userId } = getContext(req);

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
    userId,
  };
};

export const paySettlementMapper = (req: Request): PaySettlementInput => {
  const { organizationId } = getContext(req);
  const { paymentMethod, paymentReference } = req.body;

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
    paymentMethod,
    ...(paymentReference ? { paymentReference } : {}),
  };
};

export const disputeSettlementMapper = (req: Request): DisputeSettlementInput => {
  const { organizationId } = getContext(req);
  const { disputeReason } = req.body;

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
    disputeReason,
  };
};

export const createAdjustmentMapper = (req: Request): CreateAdjustmentInput => {
  const { organizationId } = getContext(req);
  const { description, amount, date } = req.body;

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
    description,
    amount,
    date: new Date(date),
  };
};

export const updateAdjustmentMapper = (req: Request): UpdateAdjustmentInput => {
  const { organizationId } = getContext(req);
  const { description, amount, date } = req.body;

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
    lineItemId: req.params['lineItemId'] ?? '',
    ...(description !== undefined ? { description } : {}),
    ...(amount !== undefined ? { amount } : {}),
    ...(date !== undefined ? { date: new Date(date) } : {}),
  };
};

export const deleteAdjustmentMapper = (req: Request): DeleteAdjustmentInput => {
  const { organizationId } = getContext(req);

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
    lineItemId: req.params['lineItemId'] ?? '',
  };
};

export const sendSettlementMapper = (req: Request): SendSettlementInput => {
  const { organizationId } = getContext(req);

  return {
    organizationId,
    settlementId: req.params['id'] ?? '',
  };
};
