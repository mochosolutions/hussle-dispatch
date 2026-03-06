import { render, screen, within } from '@testing-library/react';
import { StateInspector } from '../StateInspector';

describe('StateInspector', () => {
  describe('rendering', () => {
    it('renders with a title', () => {
      render(<StateInspector title="Test State" state={{ key: 'value' }} />);
      expect(screen.getByText('Test State')).toBeInTheDocument();
    });

    it('renders JSON state in a pre element', () => {
      const state = { loading: { getAll: 'Pending' } };
      render(<StateInspector title="State" state={state} />);

      const preElement = screen.getByRole('region', { name: /state/i });
      expect(preElement).toBeInTheDocument();
      expect(preElement.textContent).toContain('"loading"');
      expect(preElement.textContent).toContain('"getAll"');
      expect(preElement.textContent).toContain('"Pending"');
    });

    it('formats JSON with proper indentation', () => {
      const state = { a: { b: 'c' } };
      render(<StateInspector title="State" state={state} />);

      const preElement = screen.getByRole('region', { name: /state/i });
      // JSON.stringify with 2 spaces indentation
      expect(preElement.textContent).toBe(JSON.stringify(state, null, 2));
    });
  });

  describe('with complex state', () => {
    it('handles nested objects', () => {
      const state = {
        pages: {
          taskPage: {
            loading: { getAll: 'Fulfilled' },
            errors: {},
          },
        },
      };
      render(<StateInspector title="Redux State" state={state} />);

      const preElement = screen.getByRole('region', { name: /state/i });
      expect(preElement.textContent).toContain('"pages"');
      expect(preElement.textContent).toContain('"taskPage"');
      expect(preElement.textContent).toContain('"Fulfilled"');
    });

    it('handles arrays', () => {
      const state = { ids: ['task-1', 'task-2'] };
      render(<StateInspector title="State" state={state} />);

      const preElement = screen.getByRole('region', { name: /state/i });
      expect(preElement.textContent).toContain('"ids"');
      expect(preElement.textContent).toContain('"task-1"');
      expect(preElement.textContent).toContain('"task-2"');
    });

    it('handles empty state', () => {
      render(<StateInspector title="Empty" state={{}} />);

      const preElement = screen.getByRole('region', { name: /state/i });
      expect(preElement.textContent).toBe('{}');
    });
  });

  describe('path highlighting', () => {
    it('shows highlighted path when provided', () => {
      const state = { loading: { getAll: 'Pending' } };
      render(<StateInspector title="State" state={state} highlightPath="loading.getAll" />);

      expect(screen.getByText('loading.getAll')).toBeInTheDocument();
    });

    it('does not show path section when highlightPath is not provided', () => {
      const state = { loading: {} };
      render(<StateInspector title="State" state={state} />);

      expect(screen.queryByText(/Path:/)).not.toBeInTheDocument();
    });
  });

  describe('maxHeight', () => {
    it('applies maxHeight style when provided', () => {
      render(<StateInspector title="State" state={{ key: 'value' }} maxHeight={200} />);

      const preElement = screen.getByRole('region', { name: /state/i });
      expect(preElement).toHaveStyle({ maxHeight: '200px' });
    });

    it('uses default maxHeight when not provided', () => {
      render(<StateInspector title="State" state={{ key: 'value' }} />);

      const preElement = screen.getByRole('region', { name: /state/i });
      expect(preElement).toHaveStyle({ maxHeight: '400px' });
    });
  });

  describe('accessibility', () => {
    it('has proper role attribute', () => {
      render(<StateInspector title="State" state={{}} />);
      expect(screen.getByRole('region', { name: /state/i })).toBeInTheDocument();
    });

    it('has aria-label for screen readers', () => {
      render(<StateInspector title="My State" state={{}} />);
      const preElement = screen.getByRole('region', { name: /state/i });
      expect(preElement).toHaveAttribute('aria-label', 'My State state viewer');
    });
  });
});
