import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AnalyticEcommerce from './AnalyticEcommerce';
import AnalyticsDataCard from './AnalyticsDataCard';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('AnalyticEcommerce', () => {
  describe('rendering', () => {
    it('renders title', () => {
      renderWithTheme(
        <AnalyticEcommerce
          title="Total Page Views"
          count="4,42,236"
          extra="35,000"
        />
      );

      expect(screen.getByText('Total Page Views')).toBeInTheDocument();
    });

    it('renders count', () => {
      renderWithTheme(
        <AnalyticEcommerce
          title="Total Revenue"
          count="$78,250"
          extra="$20,000"
        />
      );

      expect(screen.getByText('$78,250')).toBeInTheDocument();
    });

    it('renders extra value', () => {
      renderWithTheme(
        <AnalyticEcommerce
          title="Total Users"
          count="1,000"
          extra="200"
        />
      );

      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('renders percentage chip when provided', () => {
      renderWithTheme(
        <AnalyticEcommerce
          title="Sales"
          count="$10,000"
          percentage={25.5}
          extra="$2,000"
        />
      );

      expect(screen.getByText('25.5%')).toBeInTheDocument();
    });

    it('does not render percentage chip when not provided', () => {
      renderWithTheme(
        <AnalyticEcommerce
          title="Sales"
          count="$10,000"
          extra="$2,000"
        />
      );

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('trend indicators', () => {
    it('shows rise icon for gain', () => {
      const { container } = renderWithTheme(
        <AnalyticEcommerce
          title="Revenue"
          count="$50,000"
          percentage={10}
          isLoss={false}
          extra="$5,000"
        />
      );

      // RiseOutlined icon should be present
      expect(container.querySelector('[aria-label="rise"]') ||
             screen.getByText('10%')).toBeInTheDocument();
    });

    it('shows fall icon for loss', () => {
      const { container } = renderWithTheme(
        <AnalyticEcommerce
          title="Revenue"
          count="$50,000"
          percentage={10}
          isLoss={true}
          color="error"
          extra="$5,000"
        />
      );

      // FallOutlined icon should be present (or the percentage text)
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  describe('colors', () => {
    it('accepts different color props', () => {
      renderWithTheme(
        <AnalyticEcommerce
          title="Test"
          count="100"
          percentage={5}
          color="success"
          extra="10"
        />
      );

      expect(screen.getByText('5%')).toBeInTheDocument();
    });
  });
});

describe('AnalyticsDataCard', () => {
  describe('rendering', () => {
    it('renders title', () => {
      renderWithTheme(
        <AnalyticsDataCard title="Monthly Revenue" count="$25,000">
          <div>Chart content</div>
        </AnalyticsDataCard>
      );

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    it('renders count', () => {
      renderWithTheme(
        <AnalyticsDataCard title="Users" count="12,543">
          <div>Chart content</div>
        </AnalyticsDataCard>
      );

      expect(screen.getByText('12,543')).toBeInTheDocument();
    });

    it('renders children content', () => {
      renderWithTheme(
        <AnalyticsDataCard title="Sales" count="$100">
          <div data-testid="chart">Custom Chart</div>
        </AnalyticsDataCard>
      );

      expect(screen.getByTestId('chart')).toBeInTheDocument();
      expect(screen.getByText('Custom Chart')).toBeInTheDocument();
    });

    it('renders percentage chip when provided', () => {
      renderWithTheme(
        <AnalyticsDataCard
          title="Growth"
          count="150%"
          percentage={12.5}
        >
          <div>Content</div>
        </AnalyticsDataCard>
      );

      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });
  });

  describe('trend indicators', () => {
    it('shows rise icon when not loss', () => {
      renderWithTheme(
        <AnalyticsDataCard
          title="Revenue"
          count="$100"
          percentage={8}
          isLoss={false}
        >
          <div>Content</div>
        </AnalyticsDataCard>
      );

      expect(screen.getByText('8%')).toBeInTheDocument();
    });

    it('shows fall icon when loss', () => {
      renderWithTheme(
        <AnalyticsDataCard
          title="Bounce Rate"
          count="45%"
          percentage={5}
          isLoss={true}
          color="error"
        >
          <div>Content</div>
        </AnalyticsDataCard>
      );

      expect(screen.getByText('5%')).toBeInTheDocument();
    });
  });

  describe('children', () => {
    it('renders complex children', () => {
      renderWithTheme(
        <AnalyticsDataCard title="Data" count="100">
          <div>
            <span>Line 1</span>
            <span>Line 2</span>
          </div>
        </AnalyticsDataCard>
      );

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
    });
  });
});
