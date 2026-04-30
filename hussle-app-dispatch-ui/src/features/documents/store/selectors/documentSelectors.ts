import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { documentSelectors } from '../reducers/documentEntitySlice';
import type { DocumentEntityType } from '../../types';

export const selectDocumentsByEntity = (entityType: DocumentEntityType, entityId: string) =>
  createSelector(
    [(state: RootState) => documentSelectors.selectAll(state)],
    (documents) =>
      documents.filter((doc) => doc.entityType === entityType && doc.entityId === entityId),
  );

export const selectDocumentsFetchLoading = (
  entityType: DocumentEntityType,
  entityId: string,
) => (state: RootState) => {
  // Treat `undefined` (never-fetched) as loading — matches the project rule
  // for list-page loading selectors (CLAUDE.md "Loading selectors treat
  // undefined as loading"). Without this, the empty-state branch can render
  // before the initial fetch even starts.
  const status = state.pages.documents.loading[`fetch:${entityType}:${entityId}`];
  return status === undefined || status === 'Pending';
};

export const selectUploadLoading = (clientId: string) => (state: RootState) =>
  state.pages.documents.loading[`upload:${clientId}`] === 'Pending';

export const selectUploadStatus = (clientId: string) => (state: RootState) =>
  state.pages.documents.loading[`upload:${clientId}`] ?? 'Idle';

export const selectUploadError = (clientId: string) => (state: RootState) =>
  state.pages.documents.errors[`upload:${clientId}`] ?? '';

export const selectBulkDownloadLoading = (state: RootState) =>
  state.pages.documents.loading['bulkDownload'] === 'Pending';

export const selectDocumentById = (id: string) => (state: RootState) =>
  documentSelectors.selectById(state, id);
