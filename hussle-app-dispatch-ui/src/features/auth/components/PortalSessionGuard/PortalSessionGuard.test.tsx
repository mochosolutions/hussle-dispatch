import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PortalSessionGuard } from './index';

const theme = createTheme();

interface StoreOverrides {
  portalSessionExpired?: boolean;
}

const buildStore = ({ portalSessionExpired = false }: StoreOverrides = {}) =>
  configureStore({
    reducer: {
      auth: () => ({
        portalSessionExpired,
      }),
    },
  });

const renderGuard = (overrides?: StoreOverrides) => {
  const store = buildStore(overrides);
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <PortalSessionGuard>
          <div data-testid="protected-children">portal route content</div>
        </PortalSessionGuard>
      </ThemeProvider>
    </Provider>,
  );
};

describe('PortalSessionGuard', () => {
  it('renders children when portalSessionExpired is false', () => {
    renderGuard({ portalSessionExpired: false });
    expect(screen.getByTestId('protected-children')).toBeInTheDocument();
    expect(screen.queryByTestId('portal-session-expired')).not.toBeInTheDocument();
  });

  it('renders SessionExpiredPortalScreen when portalSessionExpired is true', () => {
    renderGuard({ portalSessionExpired: true });
    expect(screen.getByTestId('portal-session-expired')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-children')).not.toBeInTheDocument();
  });
});
