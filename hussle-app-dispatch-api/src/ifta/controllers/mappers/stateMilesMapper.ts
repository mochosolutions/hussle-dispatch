import type { Request } from 'express';
import type { OverrideStateMilesInput, GetStateMilesInput } from '../../services/stateMilesOverrideService';

export const putStateMilesMapper = (req: Request): OverrideStateMilesInput => ({
  loadId: req.params.loadId ?? '',
  organizationId: req.organizationId ?? '',
  stateMiles: req.body.stateMiles,
});

export const getStateMilesMapper = (req: Request): GetStateMilesInput => ({
  loadId: req.params.loadId ?? '',
  organizationId: req.organizationId ?? '',
});
