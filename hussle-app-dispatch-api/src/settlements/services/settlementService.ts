import Decimal from 'decimal.js';
import type { Logger } from '../../shared/utils/logger';
import { CARRIER_TYPES } from '../../shared/constants/carrierTypes';
import {
  ConflictError,
  InvalidTransitionError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/commonErrors';
import { round2 } from '../../shared/financials';
import { buildPaginationMeta } from '../../shared/responseEnvelope';
import { computeSettlementHash } from '../../shared/utils/snapshotHash';
import type {
  ApproveSettlementInput,
  CarrierQueryPort,
  DisputeSettlementInput,
  GenerateSettlementInput,
  ListSettlementsInput,
  PaySettlementInput,
  SettlementExpenseQueryPort,
  SettlementLoadQueryPort,
  SettlementRepoPort,
  SettlementWithRelations,
} from '../types/settlementTypes';

interface SettlementLineItemData {
  type: 'LOAD_REVENUE' | 'DISPATCH_FEE' | 'ACCESSORIAL' | 'EXPENSE';
  referenceId?: string;
  description: string;
  miles?: number;
  amount: number;
  date: Date;
}

interface SettlementServiceDeps {
  settlementRepo: SettlementRepoPort;
  loadQuery: SettlementLoadQueryPort;
  expenseQuery: SettlementExpenseQueryPort;
  carrierQuery: CarrierQueryPort;
  logger: Logger;
}

const generateSettlementNumber = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = String(Date.now()).slice(-6);
  return `SETT-${yyyy}${mm}${dd}-${suffix}`;
};

export const createSettlementService = (deps: SettlementServiceDeps) => ({
  generate: async (input: GenerateSettlementInput): Promise<SettlementWithRelations> => {
    // 1. Validate carrier
    const carrier = await deps.carrierQuery.findById(input.carrierId, input.organizationId);

    if (!carrier) {
      throw new ValidationError('Carrier not found');
    }

    // 2. Check carrier type
    if (carrier.type === CARRIER_TYPES.EXTERNAL_CARRIER) {
      throw new ValidationError(
        'External carriers receive dispatch fee invoices, not settlements',
      );
    }

    // 3. Check idempotency
    const existing = await deps.settlementRepo.findOverlapping(
      input.organizationId,
      input.carrierId,
      input.driverId,
      input.periodStart,
      input.periodEnd,
    );

    if (existing) {
      throw new ConflictError(
        'A settlement already exists for this carrier/driver in the specified period',
      );
    }

    // 4. Query delivered loads
    const loads = await deps.loadQuery.findDeliveredLoads(
      input.organizationId,
      input.carrierId,
      input.driverId,
      input.periodStart,
      input.periodEnd,
    );

    if (loads.length === 0) {
      throw new ValidationError('No delivered loads found for the specified period');
    }

    // 5. Build line items and accumulate full-precision totals in one pass.
    // Line items are rounded once for DB storage, but totals sum the raw
    // Decimal values to avoid round-then-sum accumulation drift.
    const lineItems: SettlementLineItemData[] = [];
    let grossRevenue = new Decimal(0);
    let dispatchFeeTotal = new Decimal(0);
    let accessorialsTotal = new Decimal(0);
    let expensesTotal = new Decimal(0);

    loads.forEach((load) => {
      const deliveredAt = load.deliveredAt ?? new Date();

      // LOAD_REVENUE
      const revenueAmount = new Decimal(String(load.carrierRate));
      grossRevenue = grossRevenue.plus(revenueAmount);
      lineItems.push({
        type: 'LOAD_REVENUE',
        referenceId: load.id,
        description: `Load ${load.loadNumber}`,
        miles: load.totalMiles ?? undefined,
        amount: Number(round2(revenueAmount)),
        date: deliveredAt,
      });

      // DISPATCH_FEE (stored positive, subtracted in totals)
      const feeAmount = new Decimal(String(load.dispatchFee)).abs();
      dispatchFeeTotal = dispatchFeeTotal.plus(feeAmount);
      lineItems.push({
        type: 'DISPATCH_FEE',
        referenceId: load.id,
        description: `Dispatch fee - Load ${load.loadNumber}`,
        amount: Number(round2(feeAmount)),
        date: deliveredAt,
      });

      // ACCESSORIAL charges
      load.accessorialCharges.forEach((charge) => {
        const chargeAmount = new Decimal(String(charge.amount));
        accessorialsTotal = accessorialsTotal.plus(chargeAmount);
        lineItems.push({
          type: 'ACCESSORIAL',
          referenceId: charge.id,
          description: charge.description ?? charge.type,
          amount: Number(round2(chargeAmount)),
          date: deliveredAt,
        });
      });
    });

    // Expenses for COMPANY_ASSET or LEASED_CARRIER with includeExpensesOnSettlement
    const shouldIncludeExpenses =
      carrier.type === CARRIER_TYPES.COMPANY_ASSET ||
      (carrier.type === CARRIER_TYPES.LEASED_CARRIER && carrier.includeExpensesOnSettlement);

    if (shouldIncludeExpenses && input.vehicleId) {
      const expenses = await deps.expenseQuery.findExpenses(
        input.organizationId,
        input.vehicleId,
        input.periodStart,
        input.periodEnd,
      );

      expenses.forEach((expense) => {
        const expenseAmount = new Decimal(String(expense.amount)).abs();
        expensesTotal = expensesTotal.plus(expenseAmount);
        lineItems.push({
          type: 'EXPENSE',
          referenceId: expense.id,
          description: expense.description,
          amount: Number(round2(expenseAmount)),
          date: expense.date,
        });
      });
    }

    const netEarnings = grossRevenue
      .minus(dispatchFeeTotal)
      .plus(accessorialsTotal)
      .minus(expensesTotal);

    const totalMiles = loads.reduce(
      (sum, load) => sum + (load.totalMiles ?? 0),
      0,
    );

    // 7. Generate settlement number
    const settlementNumber = generateSettlementNumber();

    // 8. Compute snapshot hash over rounded line items for tamper detection
    const snapshotHash = computeSettlementHash(lineItems);

    // 9. Create settlement via repo
    const settlement = await deps.settlementRepo.create({
      organizationId: input.organizationId,
      settlementNumber,
      carrierId: input.carrierId,
      driverId: input.driverId,
      vehicleId: input.vehicleId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      grossRevenue: Number(round2(grossRevenue)),
      totalMiles,
      dispatchFeeTotal: Number(round2(dispatchFeeTotal)),
      expensesTotal: Number(round2(expensesTotal)),
      netEarnings: Number(round2(netEarnings)),
      snapshotHash,
      lineItems,
    });

    deps.logger.info('Settlement generated', {
      settlementId: settlement.id,
      settlementNumber,
      carrierId: input.carrierId,
      loadCount: loads.length,
      grossRevenue: round2(grossRevenue),
      netEarnings: round2(netEarnings),
    });

    // 9. Return created settlement
    return settlement;
  },

  list: async (input: ListSettlementsInput) => {
    const [settlements, total] = await Promise.all([
      deps.settlementRepo.findMany(input),
      deps.settlementRepo.count({
        organizationId: input.organizationId,
        status: input.status,
        carrierId: input.carrierId,
        driverId: input.driverId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      }),
    ]);

    const page = Math.floor(input.skip / input.take) + 1;

    return {
      data: settlements,
      meta: buildPaginationMeta(total, page, input.take),
    };
  },

  getById: async (input: { organizationId: string; settlementId: string }) => {
    const settlement = await deps.settlementRepo.findById(
      input.settlementId,
      input.organizationId,
    );

    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    return settlement;
  },

  approve: async (input: ApproveSettlementInput) => {
    const settlement = await deps.settlementRepo.findById(
      input.settlementId,
      input.organizationId,
    );

    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    if (settlement.status !== 'DRAFT' && settlement.status !== 'DISPUTED') {
      throw new InvalidTransitionError(settlement.status, 'APPROVED', ['DRAFT', 'DISPUTED']);
    }

    if (settlement.snapshotHash !== null && settlement.snapshotHash !== undefined) {
      const currentHash = computeSettlementHash(settlement.lineItems);
      if (currentHash !== settlement.snapshotHash) {
        throw new ConflictError(
          'Settlement financials changed since generation. Please regenerate before approving.',
        );
      }
    }

    const updated = await deps.settlementRepo.update(input.settlementId, input.organizationId, {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedByUserId: input.userId,
    });

    deps.logger.info('Settlement approved', {
      settlementId: input.settlementId,
      approvedByUserId: input.userId,
    });

    return updated;
  },

  pay: async (input: PaySettlementInput) => {
    const settlement = await deps.settlementRepo.findById(
      input.settlementId,
      input.organizationId,
    );

    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    if (settlement.status !== 'APPROVED') {
      throw new InvalidTransitionError(settlement.status, 'PAID', ['APPROVED']);
    }

    const updated = await deps.settlementRepo.update(input.settlementId, input.organizationId, {
      status: 'PAID',
      paidAt: new Date(),
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
    });

    deps.logger.info('Settlement paid', {
      settlementId: input.settlementId,
      paymentMethod: input.paymentMethod,
    });

    return updated;
  },

  dispute: async (input: DisputeSettlementInput) => {
    const settlement = await deps.settlementRepo.findById(
      input.settlementId,
      input.organizationId,
    );

    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    if (settlement.status !== 'APPROVED') {
      throw new InvalidTransitionError(settlement.status, 'DISPUTED', ['APPROVED']);
    }

    const updated = await deps.settlementRepo.update(input.settlementId, input.organizationId, {
      status: 'DISPUTED',
      disputeReason: input.disputeReason,
    });

    deps.logger.info('Settlement disputed', {
      settlementId: input.settlementId,
      reason: input.disputeReason,
    });

    return updated;
  },
});
