import { render, screen } from '@testing-library/react';

import LockedFieldsBanner from '.';

describe('LockedFieldsBanner', () => {
  it('renders the default title and message', () => {
    render(<LockedFieldsBanner />);
    expect(screen.getByText('These fields are locked')).toBeInTheDocument();
    expect(
      screen.getByText(/contact your dispatcher to make changes/i),
    ).toBeInTheDocument();
  });

  it('renders custom title and message when provided', () => {
    render(<LockedFieldsBanner title="Custom title" message="Custom message body" />);
    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom message body')).toBeInTheDocument();
  });

  it('exposes a status role for screen readers', () => {
    render(<LockedFieldsBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
