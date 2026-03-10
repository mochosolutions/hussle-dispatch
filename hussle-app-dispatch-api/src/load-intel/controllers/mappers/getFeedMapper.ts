import type { Request } from 'express';
import type { EquipmentType } from '../../../shared/constants/equipmentTypes';
import type { LoadSource } from '../../../shared/constants/loadSources';
import type { FeedQueryParams } from '../../types/loadIntelTypes';

export const getFeedMapper = (req: Request): { orgId: string; params: FeedQueryParams } => {
  const query = req.query;

  const hasRateRaw = query['hasRate'];
  const includeChansRaw = query['includeChains'];

  const parseHasRate = (raw: string | undefined): boolean | undefined => {
    if (raw === 'true') {
      return true;
    }
    if (raw === 'false') {
      return false;
    }
    return undefined;
  };

  return {
    orgId: req.organizationId ?? '',
    params: {
      page: Number(query['page']) || 1,
      limit: Number(query['limit']) || 25,
      score: query['score'] as FeedQueryParams['score'],
      hasRate: parseHasRate(hasRateRaw as string | undefined),
      equipmentType: query['equipmentType'] as EquipmentType | undefined,
      source: query['source'] as LoadSource | undefined,
      includeChains: includeChansRaw === 'true',
    },
  };
};
