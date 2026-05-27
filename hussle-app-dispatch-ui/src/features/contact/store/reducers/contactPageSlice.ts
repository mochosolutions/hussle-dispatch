import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { ContactStats } from 'utils/api/fleet/contactApi';

// ---------------------------------------------------------------------------
// Extended state — adds stats to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface ContactPageState extends CrudPageState {
  stats: ContactStats | null;
  statsLoading: boolean;
}

const contactPageInitialExtras: Pick<ContactPageState, 'stats' | 'statsLoading'> = {
  stats: null,
  statsLoading: false,
};

export const contactPageSlice = createCrudSlice({
  name: 'contact',
  entityName: 'contact',
  entityNamePlural: 'contacts',
});

export const contactPageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.contacts,
);

// ---------------------------------------------------------------------------
// Wrapper reducer — delegates to crudSlice, then handles custom actions
// ---------------------------------------------------------------------------

const crudReducer = contactPageSlice.reducer;

const initialState: ContactPageState = {
  ...crudReducer(undefined, { type: '@@INIT' }),
  ...contactPageInitialExtras,
};

export const contactPageReducer = (
  state: ContactPageState = initialState,
  action: UnknownAction,
): ContactPageState => {
  if (fetchContactStatsRequest.match(action)) {
    return { ...state, statsLoading: true };
  }

  if (fetchContactStatsSuccess.match(action)) {
    return { ...state, stats: action.payload, statsLoading: false };
  }

  if (fetchContactStatsFailure.match(action)) {
    return { ...state, stats: null, statsLoading: false };
  }

  const nextCrudState = crudReducer(state, action);

  if (nextCrudState === state) {
    return state;
  }

  return {
    ...nextCrudState,
    stats: state.stats,
    statsLoading: state.statsLoading,
  };
};

// Semantic action aliases — match the naming convention used by sagas and barrel exports
export const {
  fetchAllRequest: fetchContactsRequest,
  fetchAllSuccess: fetchContactsSuccess,
  fetchAllFailure: fetchContactsFailure,
  fetchByIdRequest: fetchContactDetailsRequest,
  fetchByIdSuccess: fetchContactDetailsSuccess,
  fetchByIdFailure: fetchContactDetailsFailure,
  createRequest: createContactRequest,
  createSuccess: createContactSuccess,
  createFailure: createContactFailure,
  updateRequest: updateContactRequest,
  updateSuccess: updateContactSuccess,
  updateFailure: updateContactFailure,
  deleteRequest: deleteContactRequest,
  deleteSuccess: deleteContactSuccess,
  deleteFailure: deleteContactFailure,
} = contactPageSlice.actions;

// ---------------------------------------------------------------------------
// Stats actions
// ---------------------------------------------------------------------------

export const fetchContactStatsRequest = createAction<{ id: string }>(
  'contact/fetchContactStatsRequest',
);

export const fetchContactStatsSuccess = createAction<ContactStats>(
  'contact/fetchContactStatsSuccess',
);

export const fetchContactStatsFailure = createAction<string>('contact/fetchContactStatsFailure');
