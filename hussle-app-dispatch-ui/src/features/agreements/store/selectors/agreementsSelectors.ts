import type { RootState } from 'store';
import type { Agreement } from '../../types';

const EMPTY: readonly Agreement[] = Object.freeze([]);

export const selectAgreementsByCarrier = (
  state: RootState,
  carrierId: string,
): readonly Agreement[] => state.pages.agreements.byCarrierId[carrierId] ?? EMPTY;

export const selectAgreementsFetchLoading = (
  state: RootState,
  carrierId: string,
): boolean => state.pages.agreements.loading[`fetch:${carrierId}`] === 'Pending';
