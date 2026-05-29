import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import rootReducer from 'store/reducers';
import type { OrgSettings } from '../../../types';
import GeneralTab from '../GeneralTab';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// DrawerManager relies on MUI Drawer internals; skip for unit tests
jest.mock('features/ui/hooks/useDrawerActions', () => ({
  useDrawerActions: () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }),
}));

// Prevent fetchSettingsRequest from flipping loading:true and wiping rendered data.
// The component calls dispatch(fetchSettingsRequest()) in useEffect; in tests we
// pre-populate the store, so this action is a no-op.
jest.mock('../../../store/reducers/settingsSlice', () => {
  const actual = jest.requireActual('../../../store/reducers/settingsSlice');
  return {
    ...actual,
    fetchSettingsRequest: () => ({ type: '@@NOOP/fetchSettingsRequest' }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockSettings: OrgSettings = {
  id: 'settings-1',
  organizationId: 'org-1',
  defaultTonuFee: 250,
  prohibitedCommodities: ['Hazmat'],
  weeklyGrossTarget: 5000,
  defaultDetentionRate: 75,
  detentionFreeHours: 2,
  minBookRateProfitMargin: 0.15,
  defaultMaxDaysOut: 14,
  chainDepthThresholdMiles: 250,
  backhaulSearchRadiusMiles: 150,
  autoScrapingEnabled: true,
  loadIntelEmailAddress: 'intel@acme.com',
  sesFromEmail: 'no-reply@acme.com',
  companyLogoUrl: null,
  smsPrePickupLeadMinutes: 60,
  smsTransitIntervalMinutes: 180,
  smsPostPickupEscalationMinutes: 30,
  smsCooldownMinutes: 15,
  headquartersLatitude: 34.0522,
  headquartersLongitude: -118.2437,
};

const makeTenant = (role: string) => ({
  role,
  status: 'active',
  membershipId: 'mem-1',
  userId: 'user-1',
  orgName: 'Acme',
  orgSubscriptionTier: 'basic',
  orgStatus: 'active',
  organizationId: 'org-1',
  createdAt: '',
  updatedAt: '',
});

const buildStoreWithPreload = (role: 'admin' | 'dispatcher') => {
  // Build a bare store first to get the initial combined state shape,
  // then override the slices we care about.
  const baseStore = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false, serializableCheck: false }),
  });

  const baseState = baseStore.getState();

  const preloadedState = {
    ...baseState,
    auth: {
      ...baseState.auth,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role,
        organizationId: 'org-1',
      },
      orgs: [makeTenant(role)],
      isInitializing: false,
      initAttempted: true,
    },
    pages: {
      ...baseState.pages,
      settings: {
        settings: mockSettings,
        loading: false,
        error: null,
        saving: false,
      },
    },
  };

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false, serializableCheck: false }),
  });
};

const renderGeneralTab = (role: 'admin' | 'dispatcher') => {
  const testStore = buildStoreWithPreload(role);
  return render(
    <Provider store={testStore}>
      <ThemeProvider theme={createTheme()}>
        <GeneralTab />
      </ThemeProvider>
    </Provider>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GeneralTab', () => {
  describe('admin role', () => {
    it('renders all section headers', () => {
      renderGeneralTab('admin');

      expect(screen.getByText(/financial settings/i)).toBeInTheDocument();
      expect(screen.getByText(/operations settings/i)).toBeInTheDocument();
      // Use exact text to distinguish "Communication" from "Driver Communications"
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText(/driver communications/i)).toBeInTheDocument();
      expect(screen.getByText(/headquarters location/i)).toBeInTheDocument();
    });

    it('renders at least one Edit button', () => {
      renderGeneralTab('admin');
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('renders formatted TONU fee value', () => {
      renderGeneralTab('admin');
      expect(screen.getByText('$250')).toBeInTheDocument();
    });

    it('renders the Headquarters Location section', () => {
      renderGeneralTab('admin');
      expect(screen.getByText(/headquarters location/i)).toBeInTheDocument();
      expect(screen.getByText('34.0522')).toBeInTheDocument();
    });
  });

  describe('dispatcher role', () => {
    it('renders no Edit buttons', () => {
      renderGeneralTab('dispatcher');
      const editButtons = screen.queryAllByRole('button', { name: /edit/i });
      expect(editButtons).toHaveLength(0);
    });

    it('does NOT render the Headquarters Location section', () => {
      renderGeneralTab('dispatcher');
      expect(screen.queryByText(/headquarters location/i)).not.toBeInTheDocument();
    });

    it('still renders the financial section', () => {
      renderGeneralTab('dispatcher');
      expect(screen.getByText(/financial settings/i)).toBeInTheDocument();
    });
  });
});
