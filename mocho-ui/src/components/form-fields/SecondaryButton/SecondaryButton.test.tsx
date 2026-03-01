import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecondaryButton } from './index';

describe('SecondaryButton', () => {
  it('renders with label', () => {
    render(<SecondaryButton label="Resend Code" onClick={jest.fn()} />);

    expect(screen.getByText('Resend Code')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<SecondaryButton label="Resend Code" onClick={handleClick} />);

    await user.click(screen.getByText('Resend Code'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with text variant by default', () => {
    render(<SecondaryButton label="Resend Code" onClick={jest.fn()} />);

    const button = screen.getByText('Resend Code');
    expect(button).not.toHaveStyle({ textDecoration: 'underline' });
  });

  it('renders with underline for outlined variant', () => {
    render(<SecondaryButton label="Resend Code" onClick={jest.fn()} variant="outlined" />);

    const button = screen.getByText('Resend Code');
    expect(button).toHaveStyle({ textDecoration: 'underline' });
  });

  it('has cursor pointer style', () => {
    render(<SecondaryButton label="Resend Code" onClick={jest.fn()} />);

    const button = screen.getByText('Resend Code');
    expect(button).toHaveStyle({ cursor: 'pointer' });
  });
});
