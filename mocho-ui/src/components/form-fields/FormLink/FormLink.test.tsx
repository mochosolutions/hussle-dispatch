import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FormLink } from './index';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FormLink', () => {
  it('renders with label', () => {
    renderWithRouter(<FormLink label="Forgot Password?" to="/forgot-password" />);

    expect(screen.getByRole('link', { name: 'Forgot Password?' })).toBeInTheDocument();
  });

  it('has correct href', () => {
    renderWithRouter(<FormLink label="Forgot Password?" to="/forgot-password" />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/forgot-password');
  });

  it('renders with h6 variant by default', () => {
    renderWithRouter(<FormLink label="Forgot Password?" to="/forgot-password" />);

    const link = screen.getByRole('link');
    expect(link).toHaveClass('MuiTypography-h6');
  });

  it('renders with custom variant', () => {
    renderWithRouter(
      <FormLink label="Forgot Password?" to="/forgot-password" variant="body2" />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('MuiTypography-body2');
  });

  it('renders without underline by default', () => {
    renderWithRouter(<FormLink label="Forgot Password?" to="/forgot-password" />);

    const link = screen.getByRole('link');
    expect(link).toHaveStyle({ textDecoration: 'none' });
  });

  it('renders with underline when enabled', () => {
    renderWithRouter(
      <FormLink label="Forgot Password?" to="/forgot-password" underline />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveStyle({ textDecoration: 'underline' });
  });
});
