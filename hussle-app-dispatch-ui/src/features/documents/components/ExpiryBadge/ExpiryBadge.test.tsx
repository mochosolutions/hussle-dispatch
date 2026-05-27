import { render, screen } from '@testing-library/react';
import { addDays } from 'date-fns';

import { ExpiryBadge } from './index';

const NOW = new Date('2026-04-26T12:00:00Z');

describe('ExpiryBadge', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when expiresAt is null', () => {
    const { container } = render(<ExpiryBadge expiresAt={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when expiresAt is undefined', () => {
    const { container } = render(<ExpiryBadge expiresAt={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when expiry is more than 30 days away', () => {
    const { container } = render(<ExpiryBadge expiresAt={addDays(NOW, 35)} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders warning chip when expiry is 22 days away', () => {
    render(<ExpiryBadge expiresAt={addDays(NOW, 22)} />);

    const chip = screen.getByLabelText('Expires in 22 days');
    expect(chip).toBeInTheDocument();
    expect(screen.getByText('Expires in 22 days')).toBeInTheDocument();
    expect(chip.className).toMatch(/colorWarning/);
  });

  it('renders error chip when expiry is 5 days away', () => {
    render(<ExpiryBadge expiresAt={addDays(NOW, 5)} />);

    const chip = screen.getByLabelText('Expires in 5 days');
    expect(chip).toBeInTheDocument();
    expect(screen.getByText('Expires in 5 days')).toBeInTheDocument();
    expect(chip.className).toMatch(/colorError/);
  });

  it('renders singular label when expiry is 1 day away', () => {
    render(<ExpiryBadge expiresAt={addDays(NOW, 1)} />);

    expect(screen.getByText('Expires in 1 day')).toBeInTheDocument();
  });

  it('renders "Expires today" when expiry is today', () => {
    render(<ExpiryBadge expiresAt={NOW} />);

    expect(screen.getByText('Expires today')).toBeInTheDocument();
    expect(screen.getByLabelText('Expires today').className).toMatch(/colorError/);
  });

  it('renders "Expired" when expiry was yesterday', () => {
    render(<ExpiryBadge expiresAt={addDays(NOW, -1)} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByLabelText('Expired').className).toMatch(/colorError/);
  });

  it('accepts ISO string input', () => {
    const isoString = addDays(NOW, 3).toISOString();

    render(<ExpiryBadge expiresAt={isoString} />);

    expect(screen.getByText('Expires in 3 days')).toBeInTheDocument();
  });
});
