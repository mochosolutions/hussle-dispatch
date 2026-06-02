import type { RootState } from 'store';
import type { DriverPortalLoad } from 'utils/api/driver-portal/driverPortalApi';
import { driverPortalSelectors } from '../reducers/driverPortalEntitySlice';
import type { DocUploadStatus } from '../reducers/driverPortalPageSlice';
import type { DriverPortalStatus } from '../../types';

export const selectDriverPortalLoad =
  (loadId: string | null) =>
  (state: RootState): DriverPortalLoad | undefined =>
    loadId ? driverPortalSelectors.selectById(state, loadId) : undefined;

export const selectDriverPortalCurrentLoadId = (state: RootState): string | null =>
  state.pages.driverPortal.currentLoadId;

export const selectDriverPortalStatus = (state: RootState): DriverPortalStatus =>
  state.pages.driverPortal.portalStatus;

export const selectDriverPortalListStatus = (state: RootState): DriverPortalStatus =>
  state.pages.driverPortal.listStatus;

export const selectDriverPortalLoads = (state: RootState): DriverPortalLoad[] =>
  driverPortalSelectors.selectAll(state);

export const selectDriverPortalStatusUpdating = (state: RootState): boolean =>
  state.pages.driverPortal.statusUpdating;

export const selectDriverPortalError = (state: RootState): string | null =>
  state.pages.driverPortal.error;

export const selectDriverPortalDocUploads = (
  state: RootState,
): Record<string, DocUploadStatus> => state.pages.driverPortal.docUploads;

export const selectDriverSetupSubmitting = (state: RootState): boolean =>
  state.pages.driverPortal.setupSubmitting;

export const selectDriverSetupError = (state: RootState): string | null =>
  state.pages.driverPortal.setupError;
