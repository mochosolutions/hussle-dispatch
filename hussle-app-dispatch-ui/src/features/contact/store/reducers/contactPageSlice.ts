import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';

export const contactPageSlice = createCrudSlice({
  name: 'contact',
  entityName: 'contact',
  entityNamePlural: 'contacts',
});

export const contactPageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.contacts,
);

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
