import type { StatusHistoryWithUser } from '../../types/loadTypes';

export interface StatusHistoryResponse {
  id: string;
  loadId: string;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: string | null;
  changedByName: string | null;
  notes: string | null;
  createdAt: string;
}

export const toStatusHistoryResponse = (
  entry: StatusHistoryWithUser,
): StatusHistoryResponse => ({
  id: entry.id,
  loadId: entry.loadId,
  fromStatus: entry.fromStatus,
  toStatus: entry.toStatus,
  changedByUserId: entry.changedByUserId,
  changedByName: entry.changedBy !== null
    ? `${entry.changedBy.firstName} ${entry.changedBy.lastName}`
    : null,
  notes: entry.notes,
  createdAt: entry.createdAt.toISOString(),
});

export const toStatusHistoryListResponse = (
  entries: StatusHistoryWithUser[],
): StatusHistoryResponse[] => entries.map(toStatusHistoryResponse);
