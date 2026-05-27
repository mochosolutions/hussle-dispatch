import type { Request } from 'express';
import { parsePaginationParams } from '@/shared/pagination';

export interface PendingCarriersInput {
  organizationId: string;
  page: number;
  limit: number;
}

export const pendingCarriersMapper = (req: Request): PendingCarriersInput => {
  const { page, limit } = parsePaginationParams(req.query);
  return {
    organizationId: req.organizationId ?? '',
    page,
    limit,
  };
};
