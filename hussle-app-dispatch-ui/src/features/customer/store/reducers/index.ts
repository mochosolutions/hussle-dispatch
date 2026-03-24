export {
  customerPageSlice,
  customerPageReducer,
  setCustomerFilters,
  fetchCustomersRequest,
  fetchCustomersSuccess,
  fetchCustomersFailure,
  fetchCustomerDetailsRequest,
  fetchCustomerDetailsSuccess,
  fetchCustomerDetailsFailure,
  createCustomerRequest,
  createCustomerSuccess,
  createCustomerFailure,
  updateCustomerRequest,
  updateCustomerSuccess,
  updateCustomerFailure,
  deleteCustomerRequest,
  deleteCustomerSuccess,
  deleteCustomerFailure,
} from './customerPageSlice';

export {
  customerEntityModule,
  customerActions,
  customerReducer,
  customerSelectors,
} from './customerEntitySlice';
