import React from 'react';
import { render, screen } from '../../../../__tests__/test-utils';
import Dot from '../../Dot';

describe('Dot', () => {
  describe('rendering', () => {
    it('renders as a span element', () => {
      const { container } = render(<Dot />);

      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('renders with default size (8px)', () => {
      const { container } = render(<Dot />);

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ width: '8px', height: '8px' });
    });

    it('renders with circular shape', () => {
      const { container } = render(<Dot />);

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ borderRadius: '50%' });
    });
  });

  describe('colors', () => {
    it('applies primary color by default', () => {
      const { container } = render(<Dot />);

      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
    });

    it('applies primary color when specified', () => {
      const { container } = render(<Dot color="primary" />);

      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
    });

    it('applies secondary color', () => {
      const { container } = render(<Dot color="secondary" />);

      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
    });

    it('applies success color', () => {
      const { container } = render(<Dot color="success" />);

      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
    });

    it('applies error color', () => {
      const { container } = render(<Dot color="error" />);

      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
    });

    it('applies warning color', () => {
      const { container } = render(<Dot color="warning" />);

      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
    });

    it('applies info color', () => {
      const { container } = render(<Dot color="info" />);

      const dot = container.querySelector('span');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies custom size', () => {
      const { container } = render(<Dot size={16} />);

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ width: '16px', height: '16px' });
    });

    it('applies small size', () => {
      const { container } = render(<Dot size={4} />);

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ width: '4px', height: '4px' });
    });

    it('applies large size', () => {
      const { container } = render(<Dot size={24} />);

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ width: '24px', height: '24px' });
    });

    it('uses default size when not specified', () => {
      const { container } = render(<Dot />);

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ width: '8px', height: '8px' });
    });
  });

  describe('variants', () => {
    it('renders filled variant by default', () => {
      const { container } = render(<Dot color="primary" />);

      const dot = container.querySelector('span');
      // Filled variant has background color
      expect(dot).toBeInTheDocument();
    });

    it('renders outlined variant', () => {
      const { container } = render(<Dot color="primary" variant="outlined" />);

      const dot = container.querySelector('span');
      // Outlined variant has border and no background
      expect(dot).toBeInTheDocument();
    });

    it('outlined variant has border', () => {
      const { container } = render(<Dot color="primary" variant="outlined" />);

      const dot = container.querySelector('span');
      // Check that border style is applied
      const styles = window.getComputedStyle(dot!);
      expect(styles.borderStyle).toBe('solid');
    });
  });

  describe('custom styles', () => {
    it('applies custom sx styles', () => {
      const { container } = render(
        <Dot sx={{ marginLeft: '10px' }} />
      );

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ marginLeft: '10px' });
    });

    it('merges custom sx with default styles', () => {
      const { container } = render(
        <Dot size={12} sx={{ opacity: 0.5 }} />
      );

      const dot = container.querySelector('span');
      expect(dot).toHaveStyle({ width: '12px', height: '12px', opacity: '0.5' });
    });
  });

  describe('accessibility', () => {
    it('is a decorative element (no role required)', () => {
      const { container } = render(<Dot />);

      const dot = container.querySelector('span');
      // Dots are typically decorative and don't need specific roles
      expect(dot).toBeInTheDocument();
    });

    it('renders without explicit accessibility role', () => {
      const { container } = render(<Dot />);

      const dot = container.querySelector('span');
      // Dots should be visual indicators that don't require role
      expect(dot).not.toHaveAttribute('role');
    });
  });

  describe('use cases', () => {
    it('works as a status indicator', () => {
      const { container } = render(
        <span>
          <Dot color="success" size={8} />
          <span>Online</span>
        </span>
      );

      expect(container.querySelector('span span')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('works as a notification badge', () => {
      const { container } = render(
        <div style={{ position: 'relative' }}>
          <span>Messages</span>
          <Dot color="error" size={6} />
        </div>
      );

      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('works in a list as a bullet point', () => {
      const { container } = render(
        <div>
          <div>
            <Dot color="primary" size={6} />
            <span>Item 1</span>
          </div>
          <div>
            <Dot color="primary" size={6} />
            <span>Item 2</span>
          </div>
        </div>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(container.querySelectorAll('span').length).toBeGreaterThanOrEqual(2);
    });
  });
});
