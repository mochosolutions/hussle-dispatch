import type { Carrier, Load } from '@prisma/client';
import { DispatchFeeType, Prisma } from '@prisma/client';

export type ResolvedDispatchFee =
  | { type: 'PERCENTAGE'; percent: Prisma.Decimal }
  | { type: 'FLAT'; amount: Prisma.Decimal };

type LoadFeeFields = Pick<Load, 'dispatchFeeType' | 'dispatchFeeAmount'>;
type CarrierFeeFields = Pick<
  Carrier,
  'dispatchFeeType' | 'dispatchFeePercent' | 'dispatchFeeAmount'
>;

export const resolveDispatchFee = ({
  load,
  carrier,
}: {
  load: LoadFeeFields;
  carrier: CarrierFeeFields;
}): ResolvedDispatchFee => {
  if (
    load.dispatchFeeType === DispatchFeeType.FLAT &&
    load.dispatchFeeAmount !== null
  ) {
    return {
      type: 'FLAT',
      amount: new Prisma.Decimal(load.dispatchFeeAmount.toString()),
    };
  }

  if (
    load.dispatchFeeType === DispatchFeeType.PERCENTAGE &&
    load.dispatchFeeAmount !== null
  ) {
    return {
      type: 'PERCENTAGE',
      percent: new Prisma.Decimal(load.dispatchFeeAmount.toString()),
    };
  }

  if (carrier.dispatchFeeType === DispatchFeeType.FLAT) {
    return {
      type: 'FLAT',
      amount: new Prisma.Decimal(carrier.dispatchFeeAmount.toString()),
    };
  }

  return {
    type: 'PERCENTAGE',
    percent: new Prisma.Decimal(carrier.dispatchFeePercent.toString()),
  };
};

export const computeDispatchFeeAmount = ({
  resolvedFee,
  baseAmount,
}: {
  resolvedFee: ResolvedDispatchFee;
  baseAmount: Prisma.Decimal;
}): Prisma.Decimal => {
  if (resolvedFee.type === 'FLAT') {
    return resolvedFee.amount;
  }
  return baseAmount.mul(resolvedFee.percent).div(100);
};
