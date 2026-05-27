import { render, screen } from '@testing-library/react';

import AgreementPrefillSummary from '.';

describe('AgreementPrefillSummary', () => {
  it('renders one row per variable entry with humanized keys', () => {
    render(
      <AgreementPrefillSummary
        variables={{
          carrier_legal_name: 'Acme Trucking LLC',
          mc_number: 'MC123456',
        }}
      />,
    );
    expect(screen.getByText('Carrier Legal Name')).toBeInTheDocument();
    expect(screen.getByText('Acme Trucking LLC')).toBeInTheDocument();
    expect(screen.getByText('Mc Number')).toBeInTheDocument();
    expect(screen.getByText('MC123456')).toBeInTheDocument();
  });

  it('renders the empty-state copy when variables is {}', () => {
    render(<AgreementPrefillSummary variables={{}} />);
    expect(screen.getByText('No prefilled values.')).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    render(<AgreementPrefillSummary variables={{}} title="Document Values" />);
    expect(screen.getByText('Document Values')).toBeInTheDocument();
  });
});
