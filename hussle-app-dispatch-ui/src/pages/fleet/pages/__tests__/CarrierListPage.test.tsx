import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { store } from 'store';
import CarrierListPage from '../CarrierListPage';

const renderWithProviders = () =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme()}>
        <CarrierListPage />
      </ThemeProvider>
    </Provider>,
  );

describe('CarrierListPage', () => {
  it('renders the page title', () => {
    renderWithProviders();
    expect(screen.getByRole('heading', { name: /carriers/i })).toBeInTheDocument();
  });

  it('renders the add carrier button', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: /add carrier/i })).toBeInTheDocument();
  });
});
