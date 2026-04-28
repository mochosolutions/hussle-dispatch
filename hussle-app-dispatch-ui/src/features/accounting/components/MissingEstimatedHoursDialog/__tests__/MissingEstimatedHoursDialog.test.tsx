import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  settlementPageReducer,
  generateSettlementErrorsReceived,
} from '../../../store/reducers/settlementPageSlice';
import { MissingEstimatedHoursDialog } from '../index';

const makeStore = () =>
  configureStore({
    reducer: combineReducers({
      pages: combineReducers({ settlements: settlementPageReducer }),
    }),
  });

const renderDialog = (store: ReturnType<typeof makeStore>) =>
  render(
    <MemoryRouter>
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <MissingEstimatedHoursDialog />
        </ThemeProvider>
      </Provider>
    </MemoryRouter>,
  );

describe('MissingEstimatedHoursDialog', () => {
  it('is hidden when no missing-hours state is set', () => {
    const store = makeStore();
    renderDialog(store);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders load links when MISSING_ESTIMATED_HOURS error is received', () => {
    const store = makeStore();
    store.dispatch(
      generateSettlementErrorsReceived({
        loadIds: ['load-1', 'load-2'],
        loads: [
          { id: 'load-1', loadNumber: 'L-001' },
          { id: 'load-2', loadNumber: 'L-002' },
        ],
        message: 'Two loads missing estimated hours',
      }),
    );

    renderDialog(store);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Two loads missing estimated hours')).toBeInTheDocument();

    const link1 = screen.getByRole('link', { name: '#L-001' });
    const link2 = screen.getByRole('link', { name: '#L-002' });
    expect(link1).toHaveAttribute('href', '/loads/load-1');
    expect(link2).toHaveAttribute('href', '/loads/load-2');
  });
});
