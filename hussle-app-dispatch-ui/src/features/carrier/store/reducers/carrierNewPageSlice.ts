import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';

export const carrierPageSlice = createCrudSlice({
  name: 'carrier',
  entityName: 'carrier',
  entityNamePlural: 'carriers',
});

export const carrierPageSelectors = createCrudSelectors<RootState>((state) => state.pages.carriers);

// Semantic action aliases — match the naming convention used by sagas and barrel exports
export const {
  fetchAllRequest: fetchCarriersRequest,
  fetchAllSuccess: fetchCarriersSuccess,
  fetchAllFailure: fetchCarriersFailure,
  fetchByIdRequest: fetchCarrierDetailsRequest,
  fetchByIdSuccess: fetchCarrierDetailsSuccess,
  fetchByIdFailure: fetchCarrierDetailsFailure,
  createRequest: createCarrierRequest,
  createSuccess: createCarrierSuccess,
  createFailure: createCarrierFailure,
  updateRequest: updateCarrierRequest,
  updateSuccess: updateCarrierSuccess,
  updateFailure: updateCarrierFailure,
  deleteRequest: deleteCarrierRequest,
  deleteSuccess: deleteCarrierSuccess,
  deleteFailure: deleteCarrierFailure,
} = carrierPageSlice.actions;
