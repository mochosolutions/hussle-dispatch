import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { store } from 'store';
import {
  MemberNameCellRenderer,
  MemberRoleCellRenderer,
  MemberActionsCellRenderer,
} from '../../MemberCellRenderers';
import type { MemberGridContext } from '../../MemberCellRenderers';
import {
  InvitationActionsCellRenderer,
  InvitationExpiryCellRenderer,
} from '../../InvitationCellRenderers';
import type { InvitationGridContext } from '../../InvitationCellRenderers';
import type { Member, Invitation } from 'utils/api/team/teamApi';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@mocho/ui/components', () => ({
  NewDataGrid: () => <div data-testid="new-data-grid" />,
  MainCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('ag-grid-react', () => ({
  AgGridReact: () => <div data-testid="ag-grid-mock" />,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'mem-1',
  userId: 'user-1',
  role: 'dispatcher',
  status: 'active',
  createdAt: '2025-01-15T00:00:00.000Z',
  user: {
    id: 'user-1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
  },
  ...overrides,
});

const makeInvitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  id: 'inv-1',
  firstName: 'Bob',
  lastName: 'Jones',
  email: 'bob@example.com',
  role: 'viewer',
  status: 'pending',
  createdAt: '2025-01-10T00:00:00.000Z',
  expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </Provider>,
  );

// ---------------------------------------------------------------------------
// MemberNameCellRenderer
// ---------------------------------------------------------------------------

describe('MemberNameCellRenderer', () => {
  it('renders member name and email in a two-line cell', () => {
    const member = makeMember();
    renderWithProviders(<MemberNameCellRenderer data={member} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders nothing when data is undefined', () => {
    const { container } = renderWithProviders(<MemberNameCellRenderer data={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// MemberRoleCellRenderer — role Select dispatches changeMemberRoleRequest
// ---------------------------------------------------------------------------

describe('MemberRoleCellRenderer', () => {
  it('renders a select with the member role', () => {
    const member = makeMember({ role: 'dispatcher' });
    const ctx: MemberGridContext = {
      onRoleChange: jest.fn(),
      onRemove: jest.fn(),
      currentUserId: 'other-user',
    };
    renderWithProviders(<MemberRoleCellRenderer data={member} context={ctx} />);
    // MUI Select shows the selected value
    expect(screen.getByText('Dispatcher')).toBeInTheDocument();
  });

  it('calls onRoleChange with membershipId and new role when selection changes', async () => {
    const user = userEvent.setup();
    const member = makeMember({ id: 'mem-1', role: 'dispatcher' });
    const onRoleChange = jest.fn();
    const ctx: MemberGridContext = {
      onRoleChange,
      onRemove: jest.fn(),
      currentUserId: 'other-user',
    };
    renderWithProviders(<MemberRoleCellRenderer data={member} context={ctx} />);

    // Open the select
    await user.click(screen.getByRole('combobox'));
    // Choose 'Admin'
    await user.click(screen.getByRole('option', { name: 'Admin' }));

    expect(onRoleChange).toHaveBeenCalledWith('mem-1', 'admin');
  });
});

// ---------------------------------------------------------------------------
// MemberActionsCellRenderer — Remove button hidden for current user
// ---------------------------------------------------------------------------

describe('MemberActionsCellRenderer', () => {
  it('renders Remove button for other users', () => {
    const member = makeMember({ userId: 'user-1' });
    const onRemove = jest.fn();
    const ctx: MemberGridContext = {
      onRoleChange: jest.fn(),
      onRemove,
      currentUserId: 'user-99',
    };
    renderWithProviders(<MemberActionsCellRenderer data={member} context={ctx} />);
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('hides Remove button for the current user', () => {
    const member = makeMember({ userId: 'user-1' });
    const ctx: MemberGridContext = {
      onRoleChange: jest.fn(),
      onRemove: jest.fn(),
      currentUserId: 'user-1',
    };
    renderWithProviders(<MemberActionsCellRenderer data={member} context={ctx} />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('calls onRemove with the member when Remove is clicked', async () => {
    const user = userEvent.setup();
    const member = makeMember({ userId: 'user-1' });
    const onRemove = jest.fn();
    const ctx: MemberGridContext = {
      onRoleChange: jest.fn(),
      onRemove,
      currentUserId: 'user-99',
    };
    renderWithProviders(<MemberActionsCellRenderer data={member} context={ctx} />);
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith(member);
  });
});

// ---------------------------------------------------------------------------
// InvitationActionsCellRenderer — Resend / Revoke dispatch correct actions
// ---------------------------------------------------------------------------

describe('InvitationActionsCellRenderer', () => {
  it('renders Resend and Revoke buttons', () => {
    const inv = makeInvitation();
    const ctx: InvitationGridContext = {
      onResend: jest.fn(),
      onRevoke: jest.fn(),
      loading: {},
    };
    renderWithProviders(<InvitationActionsCellRenderer data={inv} context={ctx} />);
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revoke/i })).toBeInTheDocument();
  });

  it('calls onResend with inviteId when Resend is clicked', async () => {
    const user = userEvent.setup();
    const inv = makeInvitation({ id: 'inv-1' });
    const onResend = jest.fn();
    const ctx: InvitationGridContext = {
      onResend,
      onRevoke: jest.fn(),
      loading: {},
    };
    renderWithProviders(<InvitationActionsCellRenderer data={inv} context={ctx} />);
    await user.click(screen.getByRole('button', { name: /resend/i }));
    expect(onResend).toHaveBeenCalledWith('inv-1');
  });

  it('calls onRevoke with inviteId when Revoke is clicked', async () => {
    const user = userEvent.setup();
    const inv = makeInvitation({ id: 'inv-1' });
    const onRevoke = jest.fn();
    const ctx: InvitationGridContext = {
      onResend: jest.fn(),
      onRevoke,
      loading: {},
    };
    renderWithProviders(<InvitationActionsCellRenderer data={inv} context={ctx} />);
    await user.click(screen.getByRole('button', { name: /revoke/i }));
    expect(onRevoke).toHaveBeenCalledWith('inv-1');
  });

  it('disables both buttons while a row operation is pending', () => {
    const inv = makeInvitation({ id: 'inv-1' });
    const ctx: InvitationGridContext = {
      onResend: jest.fn(),
      onRevoke: jest.fn(),
      loading: { 'resend:inv-1': 'Pending' },
    };
    renderWithProviders(<InvitationActionsCellRenderer data={inv} context={ctx} />);
    expect(screen.getByRole('button', { name: /resend/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /revoke/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// InvitationExpiryCellRenderer — expired shows ErrorText
// ---------------------------------------------------------------------------

describe('InvitationExpiryCellRenderer', () => {
  it('shows "Expired" text for past expiry dates', () => {
    const inv = makeInvitation({
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    renderWithProviders(<InvitationExpiryCellRenderer data={inv} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows days remaining for future expiry dates', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const inv = makeInvitation({ expiresAt: futureDate });
    renderWithProviders(<InvitationExpiryCellRenderer data={inv} />);
    expect(screen.getByText(/in \d+ days?/)).toBeInTheDocument();
  });
});
