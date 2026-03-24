import { calculateLoadFinancials } from '@/shared/financials';
import { OwnerOperatorNotSupportedError } from '@/shared/errors';
import type { Logger } from '@/shared/utils/logger';
import type { LoadWithRelations } from '../types/loadTypes';
import type { LoadStatusRepoPort } from '../types/loadStatusTypes';

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

interface CalculateAndPersistFinancialsDeps {
  loadStatusRepo: Pick<LoadStatusRepoPort, 'sumAccessorialCharges' | 'updateFinancials'>;
  logger: Logger;
  load: LoadWithRelations;
}

// ---------------------------------------------------------------------------
// Reusable financial calculation + persistence
// ---------------------------------------------------------------------------

export const calculateAndPersistFinancials = async (
  loadId: string,
  deps: CalculateAndPersistFinancialsDeps,
): Promise<void> => {
  const { load, logger, loadStatusRepo } = deps;
  const { carrier } = load;

  if (carrier === null) {
    logger.warn('Skipping financial calculation — no carrier assigned', { loadId });
    return;
  }

  if (load.customerRate === null) {
    logger.warn('Skipping financial calculation — no customer rate set', { loadId });
    return;
  }

  const accessorialsTotal = await loadStatusRepo.sumAccessorialCharges(loadId);

  try {
    const result = calculateLoadFinancials({
      customerRate: load.customerRate.toString(),
      accessorials: accessorialsTotal,
      loadedMiles: load.loadedMiles,
      carrier: {
        type: carrier.type,
        dispatchFeePercent: carrier.dispatchFeePercent.toString(),
        partnerSplitPercent: carrier.partnerSplitPercent.toString(),
        feeIncludesAccessorials: carrier.feeIncludesAccessorials,
      },
    });

    await loadStatusRepo.updateFinancials(loadId, {
      dispatchFee: result.dispatchFee,
      partnerSplit: result.partnerSplit,
      ratePerMile: result.ratePerMile,
    });

    logger.info('Financials calculated and persisted', {
      loadId,
      dispatchFee: result.dispatchFee,
      partnerSplit: result.partnerSplit,
      ratePerMile: result.ratePerMile,
    });
  } catch (error: unknown) {
    if (error instanceof OwnerOperatorNotSupportedError) {
      logger.warn('Skipping financial calculation — owner-operator not supported', { loadId });
      return;
    }
    throw error;
  }
};
