import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  smsPromptEntityActions,
  smsPromptEntityReducer,
} from 'features/load/store/reducers/smsPromptEntitySlice';
import type { SmsPromptScheduleResponse } from 'utils/api/loads/smsPromptApi';
import { SendSmsPromptModal } from '../index';

jest.mock('components/Typography', () => ({
  __esModule: true,
  DetailRow: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  Meta: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

interface LoadFixture {
  id: string;
  loadNumber: string;
  activity: Record<string, unknown>;
  assignment: {
    driver: { id: string; firstName: string; lastName: string; phone: string | null } | null;
  };
}

const buildLoadsEntities = (load: LoadFixture) => ({
  ids: [load.id],
  entities: { [load.id]: load },
});

const buildStoreWithLoad = (load: LoadFixture) => {
  const loadsSlice = createSlice({
    name: 'loads',
    initialState: buildLoadsEntities(load),
    reducers: {},
  });

  const entities = combineReducers({
    loads: loadsSlice.reducer,
    smsPrompts: smsPromptEntityReducer,
  });

  const rootReducer = combineReducers({ entities });

  return configureStore({ reducer: rootReducer });
};

const renderModal = (
  load: LoadFixture,
  onClose: () => void = jest.fn(),
  prompts: SmsPromptScheduleResponse[] = [],
) => {
  const store = buildStoreWithLoad(load);
  if (prompts.length > 0) {
    store.dispatch(smsPromptEntityActions.upsertMany(prompts));
  }

  const utils = render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme()}>
        <SendSmsPromptModal loadId={load.id} onClose={onClose} />
      </ThemeProvider>
    </Provider>,
  );
  return { store, ...utils };
};

const loadWithDriver: LoadFixture = {
  id: 'load-1',
  loadNumber: 'L-1001',
  activity: {},
  assignment: {
    driver: { id: 'd-1', firstName: 'John', lastName: 'Doe', phone: '+15555551234' },
  },
};

const loadWithoutPhone: LoadFixture = {
  id: 'load-2',
  loadNumber: 'L-1002',
  activity: {},
  assignment: {
    driver: { id: 'd-2', firstName: 'Jane', lastName: 'Smith', phone: null },
  },
};

describe('SendSmsPromptModal', () => {
  it('renders driver name and phone', () => {
    renderModal(loadWithDriver);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+15555551234')).toBeInTheDocument();
  });

  it('disables Send button when driver has no phone', () => {
    renderModal(loadWithoutPhone);

    const send = screen.getByRole('button', { name: /^send$/i });
    expect(send).toBeDisabled();
  });

  it('dispatches sendSmsPromptRequest without calling onClose when Send is clicked', () => {
    const onClose = jest.fn();
    const store = buildStoreWithLoad(loadWithDriver);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <SendSmsPromptModal loadId={loadWithDriver.id} onClose={onClose} />
        </ThemeProvider>
      </Provider>,
    );

    dispatchSpy.mockClear();

    const send = screen.getByRole('button', { name: /^send$/i });
    fireEvent.click(send);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'load/sendSmsPromptRequest',
        payload: { loadId: 'load-1', body: undefined },
      }),
    );
    // Saga is now responsible for closing the modal on success.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('pre-fills the editable message body with the composed default', () => {
    renderModal(loadWithDriver);

    const textbox = screen.getByRole('textbox', { name: /SMS message body/i }) as HTMLTextAreaElement;
    expect(textbox.value).toContain('Hussle: Load #L-1001 needs a check-in.');
  });

  it('dispatches the edited body when the message is modified', () => {
    const store = buildStoreWithLoad(loadWithDriver);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <SendSmsPromptModal loadId={loadWithDriver.id} onClose={jest.fn()} />
        </ThemeProvider>
      </Provider>,
    );

    dispatchSpy.mockClear();

    const textbox = screen.getByRole('textbox', { name: /SMS message body/i });
    fireEvent.change(textbox, { target: { value: 'Hey John, please check in' } });

    const send = screen.getByRole('button', { name: /^send$/i });
    fireEvent.click(send);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'load/sendSmsPromptRequest',
        payload: { loadId: 'load-1', body: 'Hey John, please check in' },
      }),
    );
  });

  it('shows a Reset to default link only when the body has been edited', () => {
    renderModal(loadWithDriver);

    expect(screen.queryByRole('button', { name: /Reset to default/i })).not.toBeInTheDocument();

    const textbox = screen.getByRole('textbox', { name: /SMS message body/i });
    fireEvent.change(textbox, { target: { value: 'Custom message' } });

    expect(screen.getByRole('button', { name: /Reset to default/i })).toBeInTheDocument();
  });

  it('shows cooldown warning when a recent SENT prompt exists', () => {
    const recentSentAt = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago
    const prompt: SmsPromptScheduleResponse = {
      id: 'p-1',
      loadId: 'load-1',
      driverId: 'd-1',
      organizationId: 'org-1',
      anchor: 'MANUAL',
      scheduledAt: recentSentAt,
      status: 'SENT',
      sentAt: recentSentAt,
      twilioMessageSid: 'SM123',
      failureReason: null,
      createdAt: recentSentAt,
      updatedAt: recentSentAt,
    };

    renderModal(loadWithDriver, jest.fn(), [prompt]);

    expect(screen.getByText(/sent in the last/i)).toBeInTheDocument();
  });
});
