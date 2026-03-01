import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DebouncedInput from './index';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('DebouncedInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders input with initial value', () => {
      renderWithTheme(
        <DebouncedInput value="initial" onFilterChange={jest.fn()} />
      );

      expect(screen.getByRole('textbox')).toHaveValue('initial');
    });

    it('renders with placeholder', () => {
      renderWithTheme(
        <DebouncedInput
          value=""
          onFilterChange={jest.fn()}
          placeholder="Search..."
        />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders search icon by default', () => {
      renderWithTheme(<DebouncedInput value="" onFilterChange={jest.fn()} />);

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('renders without search icon when startAdornment is null', () => {
      const { container } = renderWithTheme(
        <DebouncedInput
          value=""
          onFilterChange={jest.fn()}
          startAdornment={null}
        />
      );

      // SVG icon should not be present (null overrides default)
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('debouncing', () => {
    it('does not call onFilterChange immediately on input', async () => {
      const onFilterChange = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithTheme(
        <DebouncedInput value="" onFilterChange={onFilterChange} debounce={500} />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      // Should not be called immediately
      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('calls onFilterChange after debounce delay', async () => {
      const onFilterChange = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithTheme(
        <DebouncedInput value="" onFilterChange={onFilterChange} debounce={500} />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      // Advance timers past debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onFilterChange).toHaveBeenCalledWith('test');
    });

    it('resets debounce timer on each keystroke', async () => {
      const onFilterChange = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithTheme(
        <DebouncedInput value="" onFilterChange={onFilterChange} debounce={500} />
      );

      const input = screen.getByRole('textbox');

      // Type first character
      await user.type(input, 't');
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Type second character (should reset timer)
      await user.type(input, 'e');
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Not called yet because timer reset
      expect(onFilterChange).not.toHaveBeenCalled();

      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(onFilterChange).toHaveBeenCalledWith('te');
    });

    it('uses custom debounce delay', async () => {
      const onFilterChange = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithTheme(
        <DebouncedInput value="" onFilterChange={onFilterChange} debounce={1000} />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      // Not called after 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onFilterChange).not.toHaveBeenCalled();

      // Called after 1000ms
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onFilterChange).toHaveBeenCalledWith('test');
    });

    it('uses default 500ms debounce when not specified', async () => {
      const onFilterChange = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithTheme(
        <DebouncedInput value="" onFilterChange={onFilterChange} />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      // Not called after 400ms
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(onFilterChange).not.toHaveBeenCalled();

      // Called after 500ms
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(onFilterChange).toHaveBeenCalledWith('test');
    });
  });

  describe('value updates', () => {
    it('updates displayed value when typing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderWithTheme(
        <DebouncedInput value="" onFilterChange={jest.fn()} />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'hello');

      expect(input).toHaveValue('hello');
    });

    it('updates value when prop changes', () => {
      const { rerender } = renderWithTheme(
        <DebouncedInput value="initial" onFilterChange={jest.fn()} />
      );

      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(
        <ThemeProvider theme={theme}>
          <DebouncedInput value="updated" onFilterChange={jest.fn()} />
        </ThemeProvider>
      );

      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });
  });

  describe('accessibility', () => {
    it('has accessible input role', () => {
      renderWithTheme(
        <DebouncedInput value="" onFilterChange={jest.fn()} />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      renderWithTheme(
        <DebouncedInput
          value=""
          onFilterChange={jest.fn()}
          inputProps={{ 'aria-label': 'Search input' }}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-label',
        'Search input'
      );
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { container } = renderWithTheme(
        <DebouncedInput value="" onFilterChange={jest.fn()} size="small" />
      );

      expect(container.querySelector('.MuiInputBase-sizeSmall')).toBeInTheDocument();
    });

    it('renders medium size by default', () => {
      const { container } = renderWithTheme(
        <DebouncedInput value="" onFilterChange={jest.fn()} />
      );

      // Medium is default, no size class added
      expect(container.querySelector('.MuiInputBase-sizeSmall')).not.toBeInTheDocument();
    });
  });

  describe('cleanup', () => {
    it('clears timeout on unmount', async () => {
      const onFilterChange = jest.fn();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      const { unmount } = renderWithTheme(
        <DebouncedInput value="" onFilterChange={onFilterChange} debounce={500} />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      // Unmount before debounce completes
      unmount();

      // Advance time - callback should not be called
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onFilterChange).not.toHaveBeenCalled();
    });
  });
});
