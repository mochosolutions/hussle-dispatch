import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  ActionsCell,
  createActionsCell,
  createStandardCrudActionsConfig,
  ActionsCellConfig,
} from '../ActionsCell';

const theme = createTheme();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.open for external links
const mockWindowOpen = jest.fn();
const originalWindowOpen = window.open;

interface TestData {
  id: string;
  name: string;
  status?: string;
}

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );
};

describe('ActionsCell', () => {
  const sampleData: TestData = {
    id: 'test-123',
    name: 'Test Item',
    status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = mockWindowOpen;
  });

  afterAll(() => {
    window.open = originalWindowOpen;
  });

  describe('rendering', () => {
    it('renders edit and delete buttons by default', () => {
      const config: ActionsCellConfig<TestData> = {
        getEditRoute: (data) => `/edit/${data.id}`,
        onDelete: jest.fn(),
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('renders view button when showView is true', () => {
      const config: ActionsCellConfig<TestData> = {
        showView: true,
        getViewRoute: (data) => `/view/${data.id}`,
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    });

    it('does not render view button by default', () => {
      const config: ActionsCellConfig<TestData> = {};

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();
    });

    it('does not render edit button when showEdit is false', () => {
      const config: ActionsCellConfig<TestData> = {
        showEdit: false,
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });

    it('does not render delete button when showDelete is false', () => {
      const config: ActionsCellConfig<TestData> = {
        showDelete: false,
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('renders custom action button when provided', () => {
      const config: ActionsCellConfig<TestData> = {
        onCustomAction: jest.fn(),
        customActionIcon: <span data-testid="custom-icon">+</span>,
        customActionTooltip: 'Custom Action',
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('tooltips', () => {
    it('renders custom tooltips', async () => {
      const config: ActionsCellConfig<TestData> = {
        showView: true,
        getViewRoute: (data) => `/view/${data.id}`,
        getEditRoute: (data) => `/edit/${data.id}`,
        onDelete: jest.fn(),
        viewTooltip: 'Preview Item',
        editTooltip: 'Modify Item',
        deleteTooltip: 'Remove Item',
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'Preview Item' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Modify Item' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Item' })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('navigates to edit route when edit button is clicked', async () => {
      const user = userEvent.setup();
      const config: ActionsCellConfig<TestData> = {
        getEditRoute: (data) => `/items/edit/${data.id}`,
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(mockNavigate).toHaveBeenCalledWith('/items/edit/test-123');
    });

    it('navigates to view route when view button is clicked', async () => {
      const user = userEvent.setup();
      const config: ActionsCellConfig<TestData> = {
        showView: true,
        getViewRoute: (data) => `/items/${data.id}`,
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      await user.click(screen.getByRole('button', { name: 'View' }));

      expect(mockNavigate).toHaveBeenCalledWith('/items/test-123');
    });

    it('opens external view in new tab when isExternalView is true', async () => {
      const user = userEvent.setup();
      const config: ActionsCellConfig<TestData> = {
        showView: true,
        isExternalView: true,
        getViewRoute: (data) => `https://example.com/${data.id}`,
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      await user.click(screen.getByRole('button', { name: 'View' }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://example.com/test-123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      const config: ActionsCellConfig<TestData> = {
        onDelete,
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      await user.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onDelete).toHaveBeenCalledWith(sampleData);
    });

    it('calls onCustomAction when custom action button is clicked', async () => {
      const user = userEvent.setup();
      const onCustomAction = jest.fn();
      const config: ActionsCellConfig<TestData> = {
        onCustomAction,
        customActionIcon: <span>+</span>,
        customActionTooltip: 'Duplicate',
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      await user.click(screen.getByRole('button', { name: 'Duplicate' }));

      expect(onCustomAction).toHaveBeenCalledWith(sampleData);
    });
  });

  describe('disabled states', () => {
    it('disables edit button when isEditDisabled returns true', () => {
      const config: ActionsCellConfig<TestData> = {
        getEditRoute: (data) => `/edit/${data.id}`,
        isEditDisabled: (data) => data.status === 'active',
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    });

    it('disables delete button when isDeleteDisabled returns true', () => {
      const config: ActionsCellConfig<TestData> = {
        onDelete: jest.fn(),
        isDeleteDisabled: (data) => data.status === 'active',
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    });

    it('disables view button when isViewDisabled returns true', () => {
      const config: ActionsCellConfig<TestData> = {
        showView: true,
        getViewRoute: (data) => `/view/${data.id}`,
        isViewDisabled: (data) => data.status === 'active',
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'View' })).toBeDisabled();
    });

    it('enables buttons when disabled functions return false', () => {
      const config: ActionsCellConfig<TestData> = {
        getEditRoute: (data) => `/edit/${data.id}`,
        onDelete: jest.fn(),
        isEditDisabled: (data) => data.status === 'inactive',
        isDeleteDisabled: (data) => data.status === 'inactive',
      };

      renderWithProviders(<ActionsCell data={sampleData} config={config} />);

      expect(screen.getByRole('button', { name: 'Edit' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Delete' })).not.toBeDisabled();
    });
  });
});

describe('createActionsCell', () => {
  const sampleData: TestData = {
    id: 'test-456',
    name: 'Factory Test Item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a configured ActionsCell component', () => {
    const ConfiguredCell = createActionsCell<TestData>({
      getEditRoute: (data) => `/edit/${data.id}`,
      onDelete: jest.fn(),
    });

    renderWithProviders(<ConfiguredCell data={sampleData} />);

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('factory-created component has correct displayName', () => {
    const ConfiguredCell = createActionsCell<TestData>({
      getEditRoute: (data) => `/edit/${data.id}`,
    });

    expect(ConfiguredCell.displayName).toBe('ConfiguredActionsCell');
  });
});

describe('createStandardCrudActionsConfig', () => {
  const sampleData: TestData = {
    id: 'test-789',
    name: 'CRUD Test Item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates config with default edit route', () => {
    const config = createStandardCrudActionsConfig<TestData>({
      basePath: '/items',
    });

    renderWithProviders(<ActionsCell data={sampleData} config={config} />);

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('creates config with view option enabled', () => {
    const config = createStandardCrudActionsConfig<TestData>({
      basePath: '/items',
      viewOptions: {
        show: true,
      },
    });

    renderWithProviders(<ActionsCell data={sampleData} config={config} />);

    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('creates config with delete callback', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const config = createStandardCrudActionsConfig<TestData>({
      basePath: '/items',
      deleteOptions: {
        onDelete,
      },
    });

    renderWithProviders(<ActionsCell data={sampleData} config={config} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledWith(sampleData);
  });

  it('uses default edit route pattern', async () => {
    const user = userEvent.setup();
    const config = createStandardCrudActionsConfig<TestData>({
      basePath: '/items',
    });

    renderWithProviders(<ActionsCell data={sampleData} config={config} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(mockNavigate).toHaveBeenCalledWith('/items/edit/test-789');
  });

  it('uses custom edit route when provided', async () => {
    const user = userEvent.setup();
    const config = createStandardCrudActionsConfig<TestData>({
      basePath: '/items',
      editOptions: {
        getRoute: (data) => `/custom/edit/${data.name}`,
      },
    });

    renderWithProviders(<ActionsCell data={sampleData} config={config} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(mockNavigate).toHaveBeenCalledWith('/custom/edit/CRUD Test Item');
  });

  it('hides edit when show is false', () => {
    const config = createStandardCrudActionsConfig<TestData>({
      basePath: '/items',
      editOptions: {
        show: false,
      },
    });

    renderWithProviders(<ActionsCell data={sampleData} config={config} />);

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('hides delete when show is false', () => {
    const config = createStandardCrudActionsConfig<TestData>({
      basePath: '/items',
      deleteOptions: {
        show: false,
      },
    });

    renderWithProviders(<ActionsCell data={sampleData} config={config} />);

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
