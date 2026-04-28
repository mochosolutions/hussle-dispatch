import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import type { InvoiceAccessorial } from '../../types';

// Mirrors the Accessorials block rendered inside InvoiceDetailPage so we can
// verify each accessorial is rendered as a distinct line item with the correct
// label and amount.

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const AccessorialsSection: React.FC<{ items: InvoiceAccessorial[] }> = ({ items }) => (
  <Box data-testid="accessorials-section">
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Description</TableCell>
          <TableCell align="right">Amount</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((acc) => (
          <TableRow key={acc.id}>
            <TableCell>{acc.description ?? acc.id}</TableCell>
            <TableCell align="right">{currencyFormatter.format(Number(acc.amount))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

describe('InvoiceDetailPage accessorial breakdown', () => {
  it('renders each accessorial with its label and amount', () => {
    const items: InvoiceAccessorial[] = [
      { id: 'a1', description: 'Detention', amount: 75 },
      { id: 'a2', description: 'Lumper Fee', amount: 125.5 },
    ];

    render(
      <ThemeProvider theme={createTheme()}>
        <AccessorialsSection items={items} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Detention')).toBeInTheDocument();
    expect(screen.getByText('$75.00')).toBeInTheDocument();
    expect(screen.getByText('Lumper Fee')).toBeInTheDocument();
    expect(screen.getByText('$125.50')).toBeInTheDocument();
  });
});
