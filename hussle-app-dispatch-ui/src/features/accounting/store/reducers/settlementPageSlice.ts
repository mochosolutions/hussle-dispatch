import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type {
  SettlementFilters,
  GenerateSettlementInput,
  PaySettlementInput,
  DisputeSettlementInput,
  CreateAdjustmentInput,
} from '../../types';

// ---------------------------------------------------------------------------
// Extended state — adds filters to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface MissingEstimatedHoursLoad {
  id: string;
  loadNumber: string;
}

export interface MissingEstimatedHoursState {
  loadIds: string[];
  loads: MissingEstimatedHoursLoad[];
  message: string;
}

export interface SettlementPageState extends CrudPageState {
  filters: SettlementFilters;
  generateMissingHours: MissingEstimatedHoursState | null;
}

const settlementPageInitialExtras: Pick<
  SettlementPageState,
  'filters' | 'generateMissingHours'
> = {
  filters: {},
  generateMissingHours: null,
};

export const settlementPageSlice = createCrudSlice({
  name: 'settlement',
  entityName: 'settlement',
  entityNamePlural: 'settlements',
});

export const settlementPageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.settlements,
);

// ---------------------------------------------------------------------------
// Wrapper reducer — delegates to crudSlice, then handles custom actions
// ---------------------------------------------------------------------------

const crudReducer = settlementPageSlice.reducer;

const initialState: SettlementPageState = {
  ...crudReducer(undefined, { type: '@@INIT' }),
  ...settlementPageInitialExtras,
};

export const settlementPageReducer = (
  state: SettlementPageState = initialState,
  action: UnknownAction,
): SettlementPageState => {
  if (setSettlementFilters.match(action)) {
    return { ...state, filters: action.payload };
  }

  if (generateSettlementErrorsReceived.match(action)) {
    return { ...state, generateMissingHours: action.payload };
  }

  if (clearGenerateSettlementErrors.match(action)) {
    return { ...state, generateMissingHours: null };
  }

  if (fetchSettlementsSuccess.match(action)) {
    const nextCrud = crudReducer(state, action);
    return {
      ...nextCrud,
      filters: state.filters,
      generateMissingHours: state.generateMissingHours,
    };
  }

  const nextCrudState = crudReducer(state, action);

  if (nextCrudState === state) {
    return state;
  }

  return {
    ...nextCrudState,
    filters: state.filters,
    generateMissingHours: state.generateMissingHours,
  };
};

// ---------------------------------------------------------------------------
// Semantic action aliases
// ---------------------------------------------------------------------------

export const {
  fetchAllRequest: fetchSettlementsRequest,
  fetchAllSuccess: fetchSettlementsSuccess,
  fetchAllFailure: fetchSettlementsFailure,
  fetchByIdRequest: fetchSettlementDetailRequest,
  fetchByIdSuccess: fetchSettlementDetailSuccess,
  fetchByIdFailure: fetchSettlementDetailFailure,
  createRequest: createSettlementRequest,
  createSuccess: createSettlementSuccess,
  createFailure: createSettlementFailure,
  updateRequest: updateSettlementRequest,
  updateSuccess: updateSettlementSuccess,
  updateFailure: updateSettlementFailure,
  deleteRequest: deleteSettlementRequest,
  deleteSuccess: deleteSettlementSuccess,
  deleteFailure: deleteSettlementFailure,
} = settlementPageSlice.actions;

// ---------------------------------------------------------------------------
// Custom actions for settlement-specific features
// ---------------------------------------------------------------------------

export const setSettlementFilters = createAction<SettlementFilters>(
  'settlement/setSettlementFilters',
);

export const generateSettlementRequest = createAction<GenerateSettlementInput>(
  'settlement/generateSettlementRequest',
);
export const generateSettlementSuccess = createAction<{ id: string }>(
  'settlement/generateSettlementSuccess',
);
export const generateSettlementFailure = createAction<{ error: string }>(
  'settlement/generateSettlementFailure',
);

export const approveSettlementRequest = createAction<{ id: string }>(
  'settlement/approveSettlementRequest',
);
export const approveSettlementSuccess = createAction<{ id: string }>(
  'settlement/approveSettlementSuccess',
);
export const approveSettlementFailure = createAction<{ id: string; error: string }>(
  'settlement/approveSettlementFailure',
);

export const paySettlementRequest = createAction<{ id: string; input: PaySettlementInput }>(
  'settlement/paySettlementRequest',
);
export const paySettlementSuccess = createAction<{ id: string }>(
  'settlement/paySettlementSuccess',
);
export const paySettlementFailure = createAction<{ id: string; error: string }>(
  'settlement/paySettlementFailure',
);

export const disputeSettlementRequest = createAction<{
  id: string;
  input: DisputeSettlementInput;
}>('settlement/disputeSettlementRequest');
export const disputeSettlementSuccess = createAction<{ id: string }>(
  'settlement/disputeSettlementSuccess',
);
export const disputeSettlementFailure = createAction<{ id: string; error: string }>(
  'settlement/disputeSettlementFailure',
);

export const downloadSettlementPdfRequest = createAction<{ id: string; shortId?: string }>(
  'settlement/downloadSettlementPdfRequest',
);
export const downloadSettlementPdfSuccess = createAction<{ id: string }>(
  'settlement/downloadSettlementPdfSuccess',
);
export const downloadSettlementPdfFailure = createAction<{ id: string; error: string }>(
  'settlement/downloadSettlementPdfFailure',
);

export const generateSettlementErrorsReceived = createAction<{
  loadIds: string[];
  loads: MissingEstimatedHoursLoad[];
  message: string;
}>('settlement/generateSettlementErrorsReceived');
export const clearGenerateSettlementErrors = createAction(
  'settlement/clearGenerateSettlementErrors',
);

export const addAdjustmentRequest = createAction<{
  settlementId: string;
  input: CreateAdjustmentInput;
}>('settlement/addAdjustmentRequest');
export const addAdjustmentSuccess = createAction<{ id: string }>(
  'settlement/addAdjustmentSuccess',
);
export const addAdjustmentFailure = createAction<{ id: string; error: string }>(
  'settlement/addAdjustmentFailure',
);
