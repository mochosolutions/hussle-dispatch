import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AgreementsCompleteBanner from '.';

describe('AgreementsCompleteBanner', () => {
  it('renders the default title text', () => {
    render(<AgreementsCompleteBanner />);
    expect(screen.getByText(/All required documents signed/)).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    render(<AgreementsCompleteBanner title="Everything signed" />);
    expect(screen.getByText('Everything signed')).toBeInTheDocument();
  });

  it('hides the download button when onDownloadAll is undefined', () => {
    render(<AgreementsCompleteBanner />);
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('renders + invokes the download button when onDownloadAll is provided', async () => {
    const handler = jest.fn();
    render(<AgreementsCompleteBanner onDownloadAll={handler} />);
    const button = screen.getByRole('button', { name: /download/i });
    await userEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
