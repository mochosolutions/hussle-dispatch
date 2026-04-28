import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { DocumentUploadDrawer, OtherLabelForm } from './index';
import { DocumentType } from '../../types';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const theme = createTheme();

const buildStore = () => {
  const slice = createSlice({
    name: 'pages',
    initialState: {
      documents: {
        loading: {},
        errors: {},
        downloadUrls: {},
      },
    },
    reducers: {},
  });
  return configureStore({
    reducer: {
      pages: slice.reducer,
    },
  });
};

const renderDrawer = (
  props: Partial<React.ComponentProps<typeof DocumentUploadDrawer>> = {},
) => {
  const store = buildStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <DocumentUploadDrawer
          context="load-detail"
          entityType="load"
          entityId="load-1"
          onClose={jest.fn()}
          {...props}
        />
      </ThemeProvider>
    </Provider>,
  );
};

const renderOtherLabelForm = (
  overrides: Partial<React.ComponentProps<typeof OtherLabelForm>> = {},
) =>
  render(
    <ThemeProvider theme={theme}>
      <OtherLabelForm
        fileName="customer-form.pdf"
        onSubmit={overrides.onSubmit ?? jest.fn()}
        onCancel={overrides.onCancel ?? jest.fn()}
      />
    </ThemeProvider>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OtherLabelForm', () => {
  it('renders the Document Name field when shown', () => {
    renderOtherLabelForm();

    const input = screen.getByLabelText(/document name/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('maxLength', '80');
  });

  it('disables the Upload button when label is empty', () => {
    renderOtherLabelForm();

    expect(screen.getByRole('button', { name: /^upload$/i })).toBeDisabled();
  });

  it('disables the Upload button when label is whitespace only', async () => {
    const user = userEvent.setup();
    renderOtherLabelForm();

    await user.type(screen.getByLabelText(/document name/i), '   ');

    expect(screen.getByRole('button', { name: /^upload$/i })).toBeDisabled();
  });

  it('enables the Upload button after entering a non-empty trimmed label', async () => {
    const user = userEvent.setup();
    renderOtherLabelForm();

    await user.type(screen.getByLabelText(/document name/i), 'Customer Form');

    expect(screen.getByRole('button', { name: /^upload$/i })).toBeEnabled();
  });

  it('calls onSubmit with the trimmed label when Upload is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderOtherLabelForm({ onSubmit });

    await user.type(screen.getByLabelText(/document name/i), '  Customer Form  ');
    await user.click(screen.getByRole('button', { name: /^upload$/i }));

    expect(onSubmit).toHaveBeenCalledWith('Customer Form');
  });

  it('calls onCancel when the cancel control is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    renderOtherLabelForm({ onCancel });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});

describe('DocumentUploadDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows replace-mode title when lockDocType and preselectedDocType are set', () => {
    renderDrawer({
      context: 'driver-profile',
      entityType: 'driver',
      entityId: 'drv-1',
      lockDocType: true,
      preselectedDocType: DocumentType.LICENSE,
    });

    expect(screen.getByText('Replace: License')).toBeInTheDocument();
  });

  it('shows default "Upload Documents" title when not in replace mode', () => {
    renderDrawer();

    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
  });

  it('dispatches uploadDocumentRequest with metadata.customLabel when OTHER label is submitted', async () => {
    const user = userEvent.setup();

    renderDrawer({
      context: 'load-detail',
      entityType: 'load',
      entityId: 'load-1',
    });

    // Open the picker
    await user.click(screen.getByRole('button', { name: /select document to upload/i }));

    // Select the "Other" doc type card (card label rendered inside the picker)
    await user.click(screen.getByText('Other'));

    // Once a card is selected, DocumentPicker mounts its hidden file input.
    // The drawer renders into a portal so we query the global document.
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) {
      throw new Error('file input not found');
    }
    const file = new File(['dummy'], 'customer-form.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // OtherLabelForm should now be visible — fill and submit
    const nameInput = await screen.findByLabelText(/document name/i);
    await user.type(nameInput, 'Customer Form');
    await user.click(screen.getByRole('button', { name: /^upload$/i }));

    // Verify dispatch was called with the right shape
    const uploadCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === 'documents/uploadDocumentRequest',
    );
    expect(uploadCall).toBeDefined();
    if (!uploadCall) {
      return;
    }
    const [action] = uploadCall;
    expect(action.payload.documentType).toBe(DocumentType.OTHER);
    expect(action.payload.entityType).toBe('load');
    expect(action.payload.entityId).toBe('load-1');
    expect(action.payload.metadata).toEqual({ customLabel: 'Customer Form' });
  });
});
