import { createAction } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';
import type { CrudPageState } from '@mocho/ui/redux';
import type { CustomerFilters, NotificationSetting } from '../../types';
import type { UpsertSettingInput } from 'utils/api/notifications/notificationApi';

// ---------------------------------------------------------------------------
// Extended state — adds filters to the standard CRUD page state
// ---------------------------------------------------------------------------

export interface CustomerPageState extends CrudPageState {
  filters: CustomerFilters;
  notificationSettings: NotificationSetting[];
  notificationSettingsLoading: boolean;
  notificationSettingsError: string | null;
}

const customerPageInitialExtras: Pick<
  CustomerPageState,
  'filters' | 'notificationSettings' | 'notificationSettingsLoading' | 'notificationSettingsError'
> = {
  filters: {},
  notificationSettings: [],
  notificationSettingsLoading: false,
  notificationSettingsError: null,
};

export const customerPageSlice = createCrudSlice({
  name: 'customer',
  entityName: 'customer',
  entityNamePlural: 'customers',
});

export const customerPageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.customers,
);

// ---------------------------------------------------------------------------
// Wrapper reducer — delegates to crudSlice, then handles custom actions
// ---------------------------------------------------------------------------

const crudReducer = customerPageSlice.reducer;

const initialState: CustomerPageState = {
  ...crudReducer(undefined, { type: '@@INIT' }),
  ...customerPageInitialExtras,
};

export const customerPageReducer = (
  state: CustomerPageState = initialState,
  action: UnknownAction,
): CustomerPageState => {
  if (setCustomerFilters.match(action)) {
    return { ...state, filters: action.payload };
  }

  if (fetchNotificationSettingsRequest.match(action)) {
    return { ...state, notificationSettingsLoading: true, notificationSettingsError: null };
  }

  if (fetchNotificationSettingsSuccess.match(action)) {
    return {
      ...state,
      notificationSettings: action.payload,
      notificationSettingsLoading: false,
    };
  }

  if (fetchNotificationSettingsFailure.match(action)) {
    return {
      ...state,
      notificationSettingsLoading: false,
      notificationSettingsError: action.payload,
    };
  }

  if (updateNotificationSettingsSuccess.match(action)) {
    return { ...state, notificationSettings: action.payload };
  }

  const nextCrudState = crudReducer(state, action);

  if (nextCrudState === state) {
    return state;
  }

  return {
    ...nextCrudState,
    filters: state.filters,
    notificationSettings: state.notificationSettings,
    notificationSettingsLoading: state.notificationSettingsLoading,
    notificationSettingsError: state.notificationSettingsError,
  };
};

// Semantic action aliases — match the naming convention used by sagas and barrel exports
export const {
  fetchAllRequest: fetchCustomersRequest,
  fetchAllSuccess: fetchCustomersSuccess,
  fetchAllFailure: fetchCustomersFailure,
  fetchByIdRequest: fetchCustomerDetailsRequest,
  fetchByIdSuccess: fetchCustomerDetailsSuccess,
  fetchByIdFailure: fetchCustomerDetailsFailure,
  createRequest: createCustomerRequest,
  createSuccess: createCustomerSuccess,
  createFailure: createCustomerFailure,
  updateRequest: updateCustomerRequest,
  updateSuccess: updateCustomerSuccess,
  updateFailure: updateCustomerFailure,
  deleteRequest: deleteCustomerRequest,
  deleteSuccess: deleteCustomerSuccess,
  deleteFailure: deleteCustomerFailure,
} = customerPageSlice.actions;

// ---------------------------------------------------------------------------
// Custom actions for customer-specific features
// ---------------------------------------------------------------------------

export const setCustomerFilters = createAction<CustomerFilters>('customer/setCustomerFilters');

// Notification settings actions
export const fetchNotificationSettingsRequest = createAction<{ customerId: string }>(
  'customer/fetchNotificationSettingsRequest',
);
export const fetchNotificationSettingsSuccess = createAction<NotificationSetting[]>(
  'customer/fetchNotificationSettingsSuccess',
);
export const fetchNotificationSettingsFailure = createAction<string>(
  'customer/fetchNotificationSettingsFailure',
);
export const updateNotificationSettingsRequest = createAction<{
  customerId: string;
  settings: UpsertSettingInput[];
}>('customer/updateNotificationSettingsRequest');
export const updateNotificationSettingsSuccess = createAction<NotificationSetting[]>(
  'customer/updateNotificationSettingsSuccess',
);
export const updateNotificationSettingsFailure = createAction<string>(
  'customer/updateNotificationSettingsFailure',
);
