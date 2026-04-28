import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { ActionsCellRenderer, DocTypeCellRenderer } from './index';
import { DocumentType, type Document } from '../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOpenDrawer = jest.fn();
const mockOpenModal = jest.fn();
const mockDispatch = jest.fn();

jest.mock('features/ui/hooks/useDrawerActions', () => ({
  useDrawerActions: () => ({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
  }),
}));

jest.mock('features/ui/hooks/useModalActions', () => ({
  useModalActions: () => ({
    openModal: mockOpenModal,
    closeModal: jest.fn(),
  }),
}));

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

const baseDoc: Document = {
  id: 'doc-1',
  organizationId: 'org-1',
  entityType: 'driver',
  entityId: 'drv-1',
  type: DocumentType.LICENSE,
  fileName: 'license.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  url: 'https://example.com/license.pdf',
  uploadStatus: 'complete',
  isArchived: false,
  notes: null,
  expiresAt: null,
  metadata: null,
  createdAt: '2026-04-01T00:00:00Z',
};

const renderActions = (options: {
  isAdmin: boolean;
  doc?: Partial<Document>;
}) => {
  const store = buildStore();
  const doc: Document = { ...baseDoc, ...options.doc };
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <ActionsCellRenderer
          data={doc}
          entityType="driver"
          entityId="drv-1"
          isAdmin={options.isAdmin}
        />
      </ThemeProvider>
    </Provider>,
  );
};

const renderDocType = (doc: Document) => {
  const store = buildStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <DocTypeCellRenderer data={doc} />
      </ThemeProvider>
    </Provider>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DocumentTable cell renderers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ActionsCellRenderer', () => {
    it('renders kebab IconButton for the row', () => {
      renderActions({ isAdmin: false });

      expect(screen.getByRole('button', { name: /document actions/i })).toBeInTheDocument();
    });

    it('shows View, Download, Replace for non-admin (no Delete)', async () => {
      const user = userEvent.setup();
      renderActions({ isAdmin: false });

      await user.click(screen.getByRole('button', { name: /document actions/i }));

      expect(screen.getByRole('menuitem', { name: 'View' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Download' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Replace' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('shows Delete when user is admin', async () => {
      const user = userEvent.setup();
      renderActions({ isAdmin: true });

      await user.click(screen.getByRole('button', { name: /document actions/i }));

      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    });

    it('opens confirmDeleteDocument modal when admin clicks Delete', async () => {
      const user = userEvent.setup();
      renderActions({ isAdmin: true });

      await user.click(screen.getByRole('button', { name: /document actions/i }));
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

      expect(mockOpenModal).toHaveBeenCalledWith('confirmDeleteDocument', {
        documentId: 'doc-1',
        fileName: 'license.pdf',
        type: DocumentType.LICENSE,
      });
    });
  });

  describe('DocTypeCellRenderer', () => {
    it('renders custom label when type is OTHER and metadata.customLabel is set', () => {
      renderDocType({
        ...baseDoc,
        type: DocumentType.OTHER,
        metadata: { customLabel: 'Customer Form' },
      });

      expect(screen.getByText('Customer Form')).toBeInTheDocument();
      expect(screen.queryByText('Other')).not.toBeInTheDocument();
    });

    it('renders standard type label for non-OTHER types', () => {
      renderDocType(baseDoc);

      expect(screen.getByText('License')).toBeInTheDocument();
    });
  });
});
