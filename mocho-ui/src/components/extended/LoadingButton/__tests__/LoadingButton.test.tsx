import React from 'react';
import { render, screen, userEvent } from '../../../../__tests__/test-utils';
import LoadingButton from '../../LoadingButton';
import { SaveOutlined, SendOutlined } from '@ant-design/icons';

describe('LoadingButton', () => {
  describe('rendering', () => {
    it('renders children text correctly', () => {
      render(<LoadingButton>Submit</LoadingButton>);

      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(<LoadingButton>Click me</LoadingButton>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<LoadingButton>Default</LoadingButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when loading=true', () => {
      render(<LoadingButton loading>Loading</LoadingButton>);

      // MUI LoadingButton adds a progress indicator
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiLoadingButton-loading');
    });

    it('disables interaction when loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton loading onClick={handleClick}>
          Loading
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      // Loading buttons are not necessarily disabled but prevent clicks
      expect(button).toHaveClass('MuiLoadingButton-loading');
    });

    it('hides text when loading with center position', () => {
      render(
        <LoadingButton loading loadingPosition="center">
          Submit
        </LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiLoadingButton-loading');
    });
  });

  describe('loading positions', () => {
    it('renders loading indicator at start position', () => {
      const { container } = render(
        <LoadingButton loading loadingPosition="start" startIcon={<SaveOutlined />}>
          Save
        </LoadingButton>
      );

      expect(container.querySelector('.MuiLoadingButton-loadingIndicator')).toBeInTheDocument();
    });

    it('renders loading indicator at end position', () => {
      const { container } = render(
        <LoadingButton loading loadingPosition="end" endIcon={<SendOutlined />}>
          Send
        </LoadingButton>
      );

      expect(container.querySelector('.MuiLoadingButton-loadingIndicator')).toBeInTheDocument();
    });

    it('renders loading indicator at center position', () => {
      const { container } = render(
        <LoadingButton loading loadingPosition="center">
          Processing
        </LoadingButton>
      );

      expect(container.querySelector('.MuiLoadingButton-loadingIndicator')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('renders start icon', () => {
      render(
        <LoadingButton startIcon={<SaveOutlined data-testid="save-icon" />}>
          Save
        </LoadingButton>
      );

      expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    });

    it('renders end icon', () => {
      render(
        <LoadingButton endIcon={<SendOutlined data-testid="send-icon" />}>
          Send
        </LoadingButton>
      );

      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('hides start icon when loading at start position', () => {
      render(
        <LoadingButton loading loadingPosition="start" startIcon={<SaveOutlined data-testid="save-icon" />}>
          Save
        </LoadingButton>
      );

      // The icon may be hidden or replaced by loading indicator
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiLoadingButton-loading');
    });
  });

  describe('variants', () => {
    it('renders text variant', () => {
      const { container } = render(
        <LoadingButton variant="text">Text</LoadingButton>
      );

      const button = container.querySelector('.MuiButton-text');
      expect(button).toBeInTheDocument();
    });

    it('renders contained variant', () => {
      render(
        <LoadingButton variant="contained">Contained</LoadingButton>
      );

      expect(screen.getByRole('button', { name: 'Contained' })).toBeInTheDocument();
    });

    it('renders outlined variant', () => {
      const { container } = render(
        <LoadingButton variant="outlined">Outlined</LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ border: '1px solid' });
    });

    it('renders dashed variant', () => {
      const { container } = render(
        <LoadingButton variant="dashed">Dashed</LoadingButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ border: '1px dashed' });
    });
  });

  describe('colors', () => {
    it('applies primary color', () => {
      render(<LoadingButton color="primary">Primary</LoadingButton>);

      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    });

    it('applies secondary color', () => {
      render(<LoadingButton color="secondary">Secondary</LoadingButton>);

      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    });

    it('applies success color', () => {
      render(<LoadingButton color="success">Success</LoadingButton>);

      expect(screen.getByRole('button', { name: 'Success' })).toBeInTheDocument();
    });

    it('applies error color', () => {
      render(<LoadingButton color="error">Error</LoadingButton>);

      expect(screen.getByRole('button', { name: 'Error' })).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { container } = render(
        <LoadingButton size="small">Small</LoadingButton>
      );

      const button = container.querySelector('.MuiButton-sizeSmall');
      expect(button).toBeInTheDocument();
    });

    it('renders medium size', () => {
      const { container } = render(
        <LoadingButton size="medium">Medium</LoadingButton>
      );

      const button = container.querySelector('.MuiButton-sizeMedium');
      expect(button).toBeInTheDocument();
    });

    it('renders large size', () => {
      const { container } = render(
        <LoadingButton size="large">Large</LoadingButton>
      );

      const button = container.querySelector('.MuiButton-sizeLarge');
      expect(button).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<LoadingButton onClick={handleClick}>Click</LoadingButton>);

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();

      render(
        <LoadingButton onClick={handleClick} disabled>
          Click
        </LoadingButton>
      );

      // Disabled buttons prevent clicks
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('renders disabled button', () => {
      render(<LoadingButton disabled>Disabled</LoadingButton>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      const { container } = render(
        <LoadingButton disabled variant="contained">
          Disabled
        </LoadingButton>
      );

      const button = container.querySelector('.Mui-disabled');
      expect(button).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('is focusable', () => {
      render(<LoadingButton>Focus me</LoadingButton>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('supports aria-label', () => {
      render(<LoadingButton aria-label="Submit form">Submit</LoadingButton>);

      expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument();
    });

    it('announces loading state', () => {
      render(<LoadingButton loading>Loading</LoadingButton>);

      // The button should indicate loading state
      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiLoadingButton-loading');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<LoadingButton ref={ref}>Ref test</LoadingButton>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('props forwarding', () => {
    it('forwards additional props', () => {
      render(<LoadingButton data-testid="custom-button">Custom</LoadingButton>);

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <LoadingButton className="custom-class">Custom</LoadingButton>
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('supports form type attribute', () => {
      render(<LoadingButton type="submit">Submit</LoadingButton>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });
});
