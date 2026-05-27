import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { BolUploadAlert } from './index';
import { fetchLoadDetailsRequest } from '../../../store/reducers';
import { uploadDocumentRequest } from 'features/documents/store/reducers/documentPageSlice';
import { DocumentType } from 'features/documents/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDispatch = jest.fn();

jest.mock('store', () => {
  const reactRedux = jest.requireActual('react-redux');
  return {
    useDispatch: () => mockDispatch,
    useSelector: reactRedux.useSelector,
  };
});

const TEST_CLIENT_ID = 'test-client-id';

beforeAll(() => {
  // crypto.randomUUID is used in BolUploadAlert. Stub for determinism.
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      randomUUID: () => TEST_CLIENT_ID,
    },
    configurable: true,
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const theme = createTheme();

interface DocPageState {
  loading: Record<string, string>;
  errors: Record<string, string>;
}

const buildStore = (docsState: DocPageState = { loading: {}, errors: {} }) => {
  const slice = createSlice({
    name: 'pages',
    initialState: {
      documents: docsState,
    },
    reducers: {},
  });
  return configureStore({
    reducer: {
      pages: slice.reducer,
    },
  });
};

const renderAlert = (
  docsState: DocPageState = { loading: {}, errors: {} },
  loadId = 'load-1',
) => {
  const store = buildStore(docsState);
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BolUploadAlert loadId={loadId} />
      </ThemeProvider>
    </Provider>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BolUploadAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Upload button in idle state', () => {
    renderAlert();
    expect(screen.getByText('Awaiting signed BOL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('dispatches uploadDocumentRequest with BOL_SIGNED when a valid file is picked', () => {
    renderAlert();

    const file = new File(['dummy'], 'signed-bol.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) {
      throw new Error('file input not found');
    }
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === uploadDocumentRequest.type,
    );
    expect(uploadCall).toBeDefined();
    if (!uploadCall) {
      return;
    }
    const [action] = uploadCall;
    expect(action.payload.documentType).toBe(DocumentType.BOL_SIGNED);
    expect(action.payload.entityType).toBe('load');
    expect(action.payload.entityId).toBe('load-1');
    expect(action.payload.clientId).toBe(TEST_CLIENT_ID);
    expect(action.payload.file).toBe(file);
  });

  it('renders progress UI when upload is in-flight', () => {
    renderAlert({
      loading: { [`upload:${TEST_CLIENT_ID}`]: 'Pending' },
      errors: {},
    });

    // Before any file pick, fileName is undefined, but the visual status comes
    // from the store. The uploading branch renders a LinearProgress (role=progressbar).
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('triggers load refetch when upload completes successfully', () => {
    renderAlert({
      loading: { [`upload:${TEST_CLIENT_ID}`]: 'Fulfilled' },
      errors: {},
    });

    const refetchCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === fetchLoadDetailsRequest.type,
    );
    expect(refetchCall).toBeDefined();
    if (!refetchCall) {
      return;
    }
    expect(refetchCall[0].payload).toEqual({ id: 'load-1' });
  });

  it('renders errorMessage when upload fails', () => {
    renderAlert({
      loading: { [`upload:${TEST_CLIENT_ID}`]: 'Rejected' },
      errors: { [`upload:${TEST_CLIENT_ID}`]: 'Server exploded' },
    });

    expect(screen.getByText('Server exploded')).toBeInTheDocument();
  });
});
