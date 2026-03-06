import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorPage from './index';

describe('ErrorPage', () => {
  it('renders oops heading', () => {
    render(<ErrorPage />);

    expect(screen.getByRole('heading', { name: 'Oops!' })).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<ErrorPage />);

    expect(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    render(<ErrorPage />);

    const container = document.getElementById('error-page');
    expect(container).toBeInTheDocument();
  });

  it('renders heading as h1', () => {
    render(<ErrorPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Oops!');
  });
});
