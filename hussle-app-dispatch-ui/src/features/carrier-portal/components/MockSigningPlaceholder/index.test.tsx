import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MockSigningPlaceholder from '.';

describe('MockSigningPlaceholder', () => {
  it('renders the mock-mode copy', () => {
    render(<MockSigningPlaceholder onMarkSigned={jest.fn()} />);
    expect(screen.getByText('Mock mode')).toBeInTheDocument();
    expect(screen.getByText(/No real signing required/)).toBeInTheDocument();
  });

  it('invokes onMarkSigned exactly once when the button is clicked', async () => {
    const handler = jest.fn();
    render(<MockSigningPlaceholder onMarkSigned={handler} />);
    await userEvent.click(screen.getByRole('button', { name: /mark as signed/i }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('disables the button + shows pending label when isPending is true', () => {
    render(<MockSigningPlaceholder onMarkSigned={jest.fn()} isPending />);
    const button = screen.getByRole('button', { name: /marking/i });
    expect(button).toBeDisabled();
  });
});
