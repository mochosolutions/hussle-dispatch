import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  signupReducer,
  codeConfirmationReducer,
  resendCodeReducer,
  loginReducer,
  initReducer,
  logoutReducer,
  refreshTokenReducer,
  forceChangePasswordReducer,
  passwordResetReducer,
  switchOrgReducer,
} from './reducers';

export type UserProfile = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  confirmationCode?: string;
  organizationId?: string;
};

export type Tenant = {
  role: string;
  status: string;
  memebershipId: string;
  userId: string;
  orgName: string;
  orgSubscriptionTier: string;
  orgStatus: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}


export interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile;
  orgs: Tenant[] | [];
  // tenant: any;
  errors: any;
  loading: any;
  isInitializing: boolean;
  rememberMe: boolean;
  session: string | null;
  forceChangePassword: boolean;
  initAttempted: boolean;
}

// export enum LoadingState {
//   Pending = 'Pending',
//   Fulfilled = 'Fulfilled',
//   Rejected = 'Rejected',
// }

export interface SignupParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name: string;
}

export interface CodeConfirmationParams {
  confirmationCode: string;
}


export const defaultUserProfileState: UserProfile = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  role: '',
};

export const defaultTenantState = {
  name: '',
  tenantId: '',
  status: '',
  subscriptionTier: '',
};

export const defaultLoadingState = {
  signup: '',
  login: '',
  init: '',
  forceChangePassword: '',
  logout: '',
  confirmCode: '',
  initPasswordReset: '',
  confirmPasswordReset: '',
  switchOrg: '',
};

export const defaultErrorState = {
  signup: '',
  login: '',
  init: '',
  forceChangePassword: '',
  logout: '',
  confirmCode: '',
  initPasswordReset: '',
  confirmPasswordReset: '',
  switchOrg: '',
};

const initialState: AuthState = {
  user: defaultUserProfileState,
  orgs: [],
  loading: defaultLoadingState,
  errors: defaultErrorState,
  // tenant: defaultTenantState,
  isLoggedIn: false,
  isInitializing: true,
  rememberMe: false,
  session: null,
  forceChangePassword: false,
  initAttempted: false,
};

export const loginSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    ...signupReducer,
    ...loginReducer,
    ...codeConfirmationReducer,
    ...resendCodeReducer,
    ...initReducer,
    ...logoutReducer,
    ...refreshTokenReducer,
    ...forceChangePasswordReducer,
    ...passwordResetReducer,
    ...switchOrgReducer,
  },
});

export const authPageSlice = createSlice({
  name: 'authPage',
  initialState: {},
  reducers: {
    setAuthLoading: (
      state: any,
      action: PayloadAction<{
        page: 'login' | 'forceChangePassword';
        loadingState: 'Fulfilled' | 'Rejected' | 'Pending';
      }>,
    ) => {
      const {page, loadingState} = action.payload;
      state[page] = {
        loading: loadingState,
      };
    },
  },
});

export const {
  signupRequest,
  signupSuccess,
  signupFailure,
  loginRequest,
  loginSuccess,
  loginFailure,
  codeConfirmationInit,
  codeConfirmationRequest,
  codeConfirmationSuccess,
  codeConfirmationFailure,
  resendCodeRequest,
  resendCodeSuccess,
  resendCodeFailure,
  initRequest,
  initSuccess,
  initFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  refreshTokenSuccess,
  refreshTokenFailure,
  forceChangePasswordSessionInit,
  forceChangePasswordRequest,
  forceChangePasswordSuccess,
  forceChangePasswordFailure,
  initiatePasswordResetRequest,
  initiatePasswordResetSuccess,
  initiatePasswordResetFailure,
  confirmPasswordResetRequest,
  confirmPasswordResetSuccess,
  confirmPasswordResetFailure,
  switchOrgRequest,
  switchOrgSuccess,
  switchOrgFailure,
} = loginSlice.actions;

export const authReducer = loginSlice.reducer;
