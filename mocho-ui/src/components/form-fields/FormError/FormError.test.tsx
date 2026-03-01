import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormError } from './index';

describe('FormError', () => {
  it('renders error message when provided', () => {
    render(<FormError error="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render anything when error is undefined', () => {
    const { container } = render(<FormError />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render anything when error is empty string', () => {
    const { container } = render(<FormError error="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders with error styling', () => {
    render(<FormError error="Something went wrong" />);

    const errorText = screen.getByText('Something went wrong');
    expect(errorText).toHaveClass('Mui-error');
  });
});
