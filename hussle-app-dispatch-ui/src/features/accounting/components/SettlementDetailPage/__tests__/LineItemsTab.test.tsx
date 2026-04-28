import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { store } from 'store';
import { LineItemsTab } from '../LineItemsTab';
import type { SettlementDetail, SettlementLineItem } from '../../../types';

jest.mock('@mocho/ui/components', () => ({
  MainCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NewDataGrid: () => null,
}));

const makeItem = (overrides: Partial<SettlementLineItem>): SettlementLineItem => ({
  id: 'x',
  type: 'LOAD_REVENUE',
  description: 'x',
  loadNumber: null,
  amount: '0',
  date: '2026-04-01',
  ...overrides,
});

const buildSettlement = (lineItems: SettlementLineItem[]): SettlementDetail =>
  ({
    id: 's1',
    settlementNumber: 'S-0001',
    status: 'DRAFT',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-07',
    grossRevenue: '1000',
    dispatchFeeTotal: '100',
    expensesTotal: '0',
    netEarnings: '900',
    totalMiles: 500,
    carrierName: 'Acme',
    driverName: 'Alice',
    createdAt: '2026-04-08',
    lineItems,
    carrierId: 'c1',
    driverId: 'd1',
    vehicleId: null,
    vehicleUnitNumber: null,
    paymentMethod: null,
    paymentReference: null,
    disputeReason: null,
    sentAt: null,
    approvedAt: null,
    paidAt: null,
  }) as SettlementDetail;

const renderTab = (settlement: SettlementDetail) =>
  render(
    <MemoryRouter>
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <LineItemsTab settlement={settlement} />
        </ThemeProvider>
      </Provider>
    </MemoryRouter>,
  );

describe('LineItemsTab', () => {
  it('groups line items by SettlementItemType', () => {
    const settlement = buildSettlement([
      makeItem({ id: '1', type: 'LOAD_REVENUE', description: 'Load rev A', amount: '1000' }),
      makeItem({ id: '2', type: 'DISPATCH_FEE', description: 'Dispatch fee A', amount: '-100' }),
      makeItem({ id: '3', type: 'DRIVER_PAY', description: 'Driver pay A', amount: '-700' }),
      makeItem({ id: '4', type: 'ACCESSORIAL', description: 'Detention', amount: '50' }),
    ]);

    renderTab(settlement);

    const loadRevGroup = screen.getByTestId('line-items-group-LOAD_REVENUE');
    expect(within(loadRevGroup).getByText('Load rev A')).toBeInTheDocument();

    const dispatchFeeGroup = screen.getByTestId('line-items-group-DISPATCH_FEE');
    expect(within(dispatchFeeGroup).getByText('Dispatch fee A')).toBeInTheDocument();

    const driverPayGroup = screen.getByTestId('line-items-group-DRIVER_PAY');
    expect(within(driverPayGroup).getByText('Driver pay A')).toBeInTheDocument();

    const accessorialGroup = screen.getByTestId('line-items-group-ACCESSORIAL');
    expect(within(accessorialGroup).getByText('Detention')).toBeInTheDocument();
  });

  it('does not render empty groups', () => {
    const settlement = buildSettlement([
      makeItem({ id: '1', type: 'LOAD_REVENUE', description: 'L', amount: '100' }),
    ]);

    renderTab(settlement);

    expect(screen.queryByTestId('line-items-group-ADJUSTMENT')).toBeNull();
    expect(screen.queryByTestId('line-items-group-EXPENSE')).toBeNull();
  });
});
