import React from 'react';
import { render, screen } from '@testing-library/react';
import { HelperText } from './index';

describe('HelperText', () => {
  it('renders with text', () => {
    render(<HelperText text="This is helpful information" />);

    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
  });

  it('renders with caption variant by default', () => {
    render(<HelperText text="Helper text" />);

    const text = screen.getByText('Helper text');
    expect(text).toHaveClass('MuiTypography-caption');
  });

  it('renders with custom variant', () => {
    render(<HelperText text="Helper text" variant="body2" />);

    const text = screen.getByText('Helper text');
    expect(text).toHaveClass('MuiTypography-body2');
  });

  it('renders with custom color', () => {
    render(<HelperText text="Helper text" color="error" />);

    const text = screen.getByText('Helper text');
    expect(text).toBeInTheDocument();
  });
});
