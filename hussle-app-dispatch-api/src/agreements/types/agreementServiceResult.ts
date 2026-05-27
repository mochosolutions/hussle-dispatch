import type { EventMap } from '@/shared/messaging/eventMap';

/**
 * Discriminated union of agreement-domain events.
 * Each variant pairs an EventMap key with its typed payload.
 */
export type AgreementEvent =
  | {
      type: 'agreement.generated';
      occurredAt: Date;
      payload: EventMap['agreement.generated'];
    }
  | {
      type: 'agreement.voided';
      occurredAt: Date;
      payload: EventMap['agreement.voided'];
    }
  | {
      type: 'agreement.finalized';
      occurredAt: Date;
      payload: EventMap['agreement.finalized'];
    };

/**
 * Standard service result envelope: business data plus zero-or-more events
 * for the controller to dispatch fire-and-forget after the request returns.
 */
export interface AgreementServiceResult<T> {
  data: T;
  events: AgreementEvent[];
}
