import type { CheckCallWithUser } from '../../types/loadTypes';

export interface CheckCallResponse {
  id: string;
  loadId: string;
  calledByUserId: string | null;
  calledByName: string | null;
  location: string | null;
  latitude: unknown;
  longitude: unknown;
  status: string | null;
  eta: string | null;
  brokerNotified: boolean;
  brokerNotes: string | null;
  notes: string | null;
  createdAt: string;
}

export const toCheckCallResponse = (checkCall: CheckCallWithUser): CheckCallResponse => ({
  id: checkCall.id,
  loadId: checkCall.loadId,
  calledByUserId: checkCall.calledByUserId,
  calledByName: checkCall.calledBy !== null
    ? `${checkCall.calledBy.firstName} ${checkCall.calledBy.lastName}`
    : null,
  location: checkCall.location,
  latitude: checkCall.latitude,
  longitude: checkCall.longitude,
  status: checkCall.status,
  eta: checkCall.eta?.toISOString() ?? null,
  brokerNotified: checkCall.brokerNotified,
  brokerNotes: checkCall.brokerNotes,
  notes: checkCall.notes,
  createdAt: checkCall.createdAt.toISOString(),
});

export const toCheckCallListResponse = (
  checkCalls: CheckCallWithUser[],
): CheckCallResponse[] => checkCalls.map(toCheckCallResponse);
