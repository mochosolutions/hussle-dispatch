import type { Logger } from '../../shared/utils/logger';
import type {
  CreateAdjustmentInput,
  DeleteAdjustmentInput,
  SettlementRepoPort,
  SettlementWithRelations,
  UpdateAdjustmentInput,
} from '../types/settlementTypes';
import { NotFoundError, ValidationError } from '../../shared/errors/commonErrors';

interface AdjustmentServiceDeps {
  settlementRepo: SettlementRepoPort;
  logger: Logger;
}

export const createSettlementAdjustmentService = (deps: AdjustmentServiceDeps) => ({
  addAdjustment: async (input: CreateAdjustmentInput): Promise<SettlementWithRelations> => {
    const settlement = await deps.settlementRepo.findById(input.settlementId, input.organizationId);

    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    if (settlement.status !== 'DRAFT') {
      throw new ValidationError('Can only add adjustments to DRAFT settlements');
    }

    await deps.settlementRepo.addLineItem({
      settlementId: input.settlementId,
      type: 'ADJUSTMENT',
      description: input.description,
      amount: input.amount,
      date: input.date,
    });

    const updated = await deps.settlementRepo.recalculateTotals(input.settlementId);

    deps.logger.info('Adjustment added to settlement', {
      settlementId: input.settlementId,
      amount: input.amount,
    });

    return updated;
  },

  updateAdjustment: async (input: UpdateAdjustmentInput): Promise<SettlementWithRelations> => {
    const settlement = await deps.settlementRepo.findById(input.settlementId, input.organizationId);

    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    if (settlement.status !== 'DRAFT') {
      throw new ValidationError('Can only edit adjustments on DRAFT settlements');
    }

    const lineItem = settlement.lineItems.find((li) => li.id === input.lineItemId);

    if (!lineItem) {
      throw new NotFoundError(`Line item ${input.lineItemId} not found`);
    }

    if (lineItem.type !== 'ADJUSTMENT') {
      throw new ValidationError('Can only edit ADJUSTMENT line items');
    }

    const updateData: Partial<{ description: string; amount: number; date: Date }> = {};
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.amount !== undefined) {
      updateData.amount = input.amount;
    }
    if (input.date !== undefined) {
      updateData.date = input.date;
    }

    await deps.settlementRepo.updateLineItem(input.lineItemId, updateData);

    const updated = await deps.settlementRepo.recalculateTotals(input.settlementId);

    deps.logger.info('Adjustment updated on settlement', {
      settlementId: input.settlementId,
      lineItemId: input.lineItemId,
    });

    return updated;
  },

  deleteAdjustment: async (input: DeleteAdjustmentInput): Promise<SettlementWithRelations> => {
    const settlement = await deps.settlementRepo.findById(input.settlementId, input.organizationId);

    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    if (settlement.status !== 'DRAFT') {
      throw new ValidationError('Can only delete adjustments from DRAFT settlements');
    }

    const lineItem = settlement.lineItems.find((li) => li.id === input.lineItemId);

    if (!lineItem) {
      throw new NotFoundError(`Line item ${input.lineItemId} not found`);
    }

    if (lineItem.type !== 'ADJUSTMENT') {
      throw new ValidationError('Can only delete ADJUSTMENT line items');
    }

    await deps.settlementRepo.deleteLineItem(input.lineItemId);

    const updated = await deps.settlementRepo.recalculateTotals(input.settlementId);

    deps.logger.info('Adjustment deleted from settlement', {
      settlementId: input.settlementId,
      lineItemId: input.lineItemId,
    });

    return updated;
  },
});
