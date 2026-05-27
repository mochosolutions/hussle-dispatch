import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AgreementsErrorBanner from '.';

describe('AgreementsErrorBanner', () => {
  it('renders the message text', () => {
    render(<AgreementsErrorBanner message="Please sign all required agreements before continuing." />);
    expect(
      screen.getByText('Please sign all required agreements before continuing.'),
    ).toBeInTheDocument();
  });

  it('exposes the alert role for screen readers', () => {
    render(<AgreementsErrorBanner message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render the dismiss button when onDismiss is undefined', () => {
    render(<AgreementsErrorBanner message="Error" />);
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('invokes onDismiss when the dismiss button is clicked', async () => {
    const handler = jest.fn();
    render(<AgreementsErrorBanner message="Error" onDismiss={handler} />);
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
