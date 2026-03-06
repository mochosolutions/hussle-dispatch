import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Logo } from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('Logo', () => {
  describe('rendering', () => {
    it('renders default fallback when no props provided', () => {
      renderWithTheme(<Logo />);

      expect(screen.getByText('Logo')).toBeInTheDocument();
    });

    it('renders text when provided', () => {
      renderWithTheme(<Logo text="Mocho Solutions" />);

      expect(screen.getByText('Mocho Solutions')).toBeInTheDocument();
    });

    it('renders image when src is provided', () => {
      renderWithTheme(<Logo src="/logo.png" alt="Company Logo" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/logo.png');
      expect(img).toHaveAttribute('alt', 'Company Logo');
    });

    it('renders both image and text', () => {
      renderWithTheme(<Logo src="/logo.png" text="Company" alt="Logo" />);

      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
    });

    it('renders text only when textOnly is true', () => {
      renderWithTheme(<Logo src="/logo.png" text="Company" textOnly />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
    });
  });

  describe('icon mode', () => {
    it('renders M fallback in icon mode', () => {
      renderWithTheme(<Logo isIcon />);

      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('does not render text in icon mode', () => {
      renderWithTheme(<Logo text="Company Name" isIcon />);

      expect(screen.queryByText('Company Name')).not.toBeInTheDocument();
    });

    it('renders smaller image in icon mode', () => {
      const { container } = renderWithTheme(
        <Logo src="/logo.png" isIcon alt="Icon" />
      );

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });
  });

  describe('link behavior', () => {
    it('renders as link when to prop is provided', () => {
      renderWithTheme(<Logo text="Company" to="/home" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/home');
    });

    it('does not render link when to prop is not provided', () => {
      renderWithTheme(<Logo text="Company" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('link wraps the logo content', () => {
      renderWithTheme(<Logo text="Company" to="/home" />);

      const link = screen.getByRole('link');
      expect(link).toContainElement(screen.getByText('Company'));
    });
  });

  describe('alt text', () => {
    it('uses custom alt text for image', () => {
      renderWithTheme(<Logo src="/logo.png" alt="Custom Alt" />);

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Custom Alt');
    });

    it('uses default alt text when not provided', () => {
      renderWithTheme(<Logo src="/logo.png" />);

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Logo');
    });
  });

  describe('accessibility', () => {
    it('text logo has appropriate heading styling', () => {
      renderWithTheme(<Logo text="Company" />);

      // Typography h5 renders as span with h5 styling
      const text = screen.getByText('Company');
      expect(text.tagName).toBe('SPAN');
    });
  });
});
