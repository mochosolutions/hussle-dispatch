import { render, screen } from '@testing-library/react';

import AgreementsFootNote from '.';

describe('AgreementsFootNote', () => {
  it('renders its children', () => {
    render(<AgreementsFootNote>Heads up: signing locks your business identity.</AgreementsFootNote>);
    expect(screen.getByText(/Heads up: signing locks your business identity/)).toBeInTheDocument();
  });
});
