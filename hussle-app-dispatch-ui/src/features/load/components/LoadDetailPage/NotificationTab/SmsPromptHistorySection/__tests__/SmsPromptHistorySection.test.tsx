import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  smsPromptEntityActions,
  smsPromptEntityReducer,
} from 'features/load/store/reducers/smsPromptEntitySlice';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';
import { SmsPromptHistorySection } from '../index';

// NewDataGrid uses AG Grid which is heavy / requires ResizeObserver etc; stub it for tests.
jest.mock('mocho/components/NewDataGrid', () => ({
  __esModule: true,
  default: ({ rowData }: { rowData: SmsPromptScheduleResponse[] }) => (
    <div data-testid="sms-history-grid">{`rows:${rowData.length}`}</div>
  ),
}));

const buildStore = () => {
  const entities = combineReducers({ smsPrompts: smsPromptEntityReducer });
  return configureStore({ reducer: combineReducers({ entities }) });
};

const renderSection = (loadId: string, prompts: SmsPromptScheduleResponse[] = []) => {
  const store = buildStore();
  if (prompts.length > 0) {
    store.dispatch(smsPromptEntityActions.upsertMany(prompts));
  }
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  const utils = render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme()}>
        <SmsPromptHistorySection loadId={loadId} />
      </ThemeProvider>
    </Provider>,
  );
  return { store, dispatchSpy, ...utils };
};

const buildPrompt = (overrides: Partial<SmsPromptScheduleResponse> = {}): SmsPromptScheduleResponse => ({
  id: 'p-1',
  loadId: 'load-1',
  driverId: 'd-1',
  organizationId: 'org-1',
  anchor: 'MANUAL',
  scheduledAt: '2026-04-22T12:00:00.000Z',
  status: 'SENT',
  sentAt: '2026-04-22T12:00:05.000Z',
  twilioMessageSid: 'SM1',
  failureReason: null,
  createdAt: '2026-04-22T12:00:00.000Z',
  updatedAt: '2026-04-22T12:00:05.000Z',
  ...overrides,
});

describe('SmsPromptHistorySection', () => {
  it('renders the empty state when no prompts exist for the load', () => {
    renderSection('load-1');

    expect(screen.queryByTestId('sms-history-grid')).not.toBeInTheDocument();
    expect(screen.getByText(/no.*sms prompt/i)).toBeInTheDocument();
  });

  it('renders the grid when prompts exist for the load', () => {
    renderSection('load-1', [buildPrompt(), buildPrompt({ id: 'p-2' })]);

    expect(screen.getByTestId('sms-history-grid')).toHaveTextContent('rows:2');
  });

  it('dispatches startSmsPromptPolling on mount and stopSmsPromptPolling on unmount', () => {
    const { dispatchSpy, unmount } = renderSection('load-1');

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'load/startSmsPromptPolling',
        payload: { loadId: 'load-1' },
      }),
    );

    dispatchSpy.mockClear();
    unmount();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'load/stopSmsPromptPolling' }),
    );
  });

  it('dispatches openModal with loadSendSmsPrompt when the header button is clicked', () => {
    const { dispatchSpy } = renderSection('load-1');
    dispatchSpy.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /send check-in sms/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ui/openModal',
        payload: expect.objectContaining({
          modalType: 'loadSendSmsPrompt',
          modalProps: { loadId: 'load-1' },
        }),
      }),
    );
  });
});
