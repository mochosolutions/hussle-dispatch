import { CarrierStatus } from '@prisma/client';
import { InvalidTransitionError } from '@/shared/errors';
import {
  allowedTransitionsFrom,
  assertTransition,
  isAllowedTransition,
} from '../carrierStateMachine';

const ALL_STATUSES = Object.values(CarrierStatus);

describe('carrierStateMachine', () => {
  describe('isAllowedTransition', () => {
    const legalEdges: [CarrierStatus, CarrierStatus][] = [
      [CarrierStatus.DRAFT, CarrierStatus.INVITED],
      [CarrierStatus.INVITED, CarrierStatus.ONBOARDING],
      [CarrierStatus.INVITED, CarrierStatus.REJECTED],
      [CarrierStatus.INVITED, CarrierStatus.ACTIVE],
      [CarrierStatus.ONBOARDING, CarrierStatus.PENDING_APPROVAL],
      [CarrierStatus.ONBOARDING, CarrierStatus.REJECTED],
      [CarrierStatus.ONBOARDING, CarrierStatus.ACTIVE],
      [CarrierStatus.PENDING_APPROVAL, CarrierStatus.ACTIVE],
      [CarrierStatus.PENDING_APPROVAL, CarrierStatus.REJECTED],
      [CarrierStatus.REJECTED, CarrierStatus.INVITED],
      [CarrierStatus.REJECTED, CarrierStatus.ACTIVE],
      [CarrierStatus.ACTIVE, CarrierStatus.ACTION_REQUIRED],
      [CarrierStatus.ACTIVE, CarrierStatus.SUSPENDED],
      [CarrierStatus.ACTION_REQUIRED, CarrierStatus.ACTIVE],
      [CarrierStatus.ACTION_REQUIRED, CarrierStatus.SUSPENDED],
      [CarrierStatus.SUSPENDED, CarrierStatus.ACTIVE],
      [CarrierStatus.SUSPENDED, CarrierStatus.ACTION_REQUIRED],
    ];

    it.each(legalEdges)('allows %s -> %s', (from, to) => {
      expect(isAllowedTransition(from, to)).toBe(true);
    });

    it('rejects every transition not in the allowed table', () => {
      const legalSet = new Set(legalEdges.map(([f, t]) => `${f}->${t}`));
      const illegal: [CarrierStatus, CarrierStatus][] = [];

      ALL_STATUSES.forEach((from) => {
        ALL_STATUSES.forEach((to) => {
          if (from !== to && !legalSet.has(`${from}->${to}`)) {
            illegal.push([from, to]);
          }
        });
      });

      illegal.forEach(([from, to]) => {
        expect(isAllowedTransition(from, to)).toBe(false);
      });
    });

    it('rejects self-transitions', () => {
      ALL_STATUSES.forEach((status) => {
        expect(isAllowedTransition(status, status)).toBe(false);
      });
    });
  });

  describe('assertTransition', () => {
    it('returns void on legal transition', () => {
      expect(() => assertTransition(CarrierStatus.DRAFT, CarrierStatus.INVITED)).not.toThrow();
    });

    it('throws InvalidTransitionError with allowed list on illegal transition', () => {
      try {
        assertTransition(CarrierStatus.DRAFT, CarrierStatus.ACTIVE);
        fail('expected throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidTransitionError);
        if (error instanceof InvalidTransitionError) {
          expect(error.currentStatus).toBe(CarrierStatus.DRAFT);
          expect(error.targetStatus).toBe(CarrierStatus.ACTIVE);
          expect(error.allowedTransitions).toEqual([CarrierStatus.INVITED]);
        }
      }
    });
  });

  describe('allowedTransitionsFrom', () => {
    it('returns the allowed list for each status', () => {
      expect(allowedTransitionsFrom(CarrierStatus.DRAFT)).toEqual([CarrierStatus.INVITED]);
      expect(allowedTransitionsFrom(CarrierStatus.ACTIVE)).toEqual([
        CarrierStatus.ACTION_REQUIRED,
        CarrierStatus.SUSPENDED,
      ]);
    });
  });
});
