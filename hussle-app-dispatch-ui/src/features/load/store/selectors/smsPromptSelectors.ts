import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { smsPromptEntitySelectors } from '../reducers/smsPromptEntitySlice';

export const selectAllSmsPrompts = (state: RootState) =>
  smsPromptEntitySelectors.selectAll(state);

export const selectSmsPromptsByLoadId = (loadId: string) =>
  createSelector([selectAllSmsPrompts], (all) => all.filter((p) => p.loadId === loadId));

export const selectLastSentAtForLoad = (loadId: string) =>
  createSelector([selectSmsPromptsByLoadId(loadId)], (prompts) => {
    let latest: string | null = null;
    prompts.forEach((p) => {
      if (p.status !== 'SENT') return;
      if (p.sentAt === null) return;
      if (latest === null || p.sentAt > latest) {
        latest = p.sentAt;
      }
    });
    return latest;
  });
