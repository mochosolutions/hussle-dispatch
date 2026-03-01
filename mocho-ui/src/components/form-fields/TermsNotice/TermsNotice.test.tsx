import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TermsNotice } from './index';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TermsNotice', () => {
  it('renders with default text', () => {
    renderWithRouter(
      <TermsNotice termsLink="/terms" privacyLink="/privacy" />
    );

    expect(screen.getByText(/by signing up, you agree to our/i)).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    renderWithRouter(
      <TermsNotice
        termsLink="/terms"
        privacyLink="/privacy"
        customText="By continuing, you accept our"
      />
    );

    expect(screen.getByText(/by continuing, you accept our/i)).toBeInTheDocument();
  });

  it('renders Terms of Service link', () => {
    renderWithRouter(
      <TermsNotice termsLink="/terms-of-service" privacyLink="/privacy" />
    );

    const termsLink = screen.getByRole('link', { name: 'Terms of Service' });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms-of-service');
  });

  it('renders Privacy Policy link', () => {
    renderWithRouter(
      <TermsNotice termsLink="/terms" privacyLink="/privacy-policy" />
    );

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  it('renders "and" text between links', () => {
    renderWithRouter(
      <TermsNotice termsLink="/terms" privacyLink="/privacy" />
    );

    expect(screen.getByText(/and/)).toBeInTheDocument();
  });
});
