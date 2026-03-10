import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import type { AttentionCategory, AttentionItem } from '../../types';

// ---------------------------------------------------------------------------
// Simple selectors
// ---------------------------------------------------------------------------

export const selectDashboardKpis = (state: RootState) => state.pages.dashboard.kpis;

export const selectWeeklyGross = (state: RootState) => state.pages.dashboard.weeklyGross ?? [];

export const selectAttentionItems = (state: RootState) => state.pages.dashboard.attentionItems ?? [];

export const selectDashboardLoading = (state: RootState) => state.pages.dashboard.loading;

export const selectKpisLoading = (state: RootState) =>
  state.pages.dashboard.loading['kpis'] === 'Pending';

export const selectWeeklyGrossLoading = (state: RootState) =>
  state.pages.dashboard.loading['weeklyGross'] === 'Pending';

export const selectAttentionItemsLoading = (state: RootState) =>
  state.pages.dashboard.loading['attentionItems'] === 'Pending';

// ---------------------------------------------------------------------------
// Derived selectors
// ---------------------------------------------------------------------------

export const selectAttentionItemsByCategory = createSelector(
  [selectAttentionItems],
  (items): Record<AttentionCategory, AttentionItem[]> => {
    const groups: Record<AttentionCategory, AttentionItem[]> = {
      EXCEPTIONS: [],
      OVERDUE_INVOICES: [],
      MISSING_RATE_CON: [],
      MISSING_BOL: [],
      EXPIRING_INSURANCE: [],
      UNCONFIRMED_PICKUPS: [],
    };

    items.forEach((item) => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });

    return groups;
  },
);

export const selectTotalAttentionCount = createSelector(
  [selectAttentionItems],
  (items) => items.length,
);
