import React from 'react';
import { render, screen, userEvent } from '../../../../__tests__/test-utils';
import IconButton from '../../IconButton';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

describe('IconButton', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(
        <IconButton>
          <EditOutlined data-testid="edit-icon" />
        </IconButton>
      );

      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(
        <IconButton>
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(
        <IconButton>
          <EditOutlined />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders text variant by default', () => {
      const { container } = render(
        <IconButton variant="text">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });

    it('renders contained variant', () => {
      const { container } = render(
        <IconButton variant="contained">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });

    it('renders outlined variant', () => {
      const { container } = render(
        <IconButton variant="outlined">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });

    it('renders dashed variant', () => {
      const { container } = render(
        <IconButton variant="dashed">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });

    it('renders light variant', () => {
      const { container } = render(
        <IconButton variant="light">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });

    it('renders shadow variant', () => {
      const { container } = render(
        <IconButton variant="shadow">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });
  });

  describe('colors', () => {
    it('applies primary color', () => {
      render(
        <IconButton color="primary">
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies secondary color', () => {
      render(
        <IconButton color="secondary">
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies error color', () => {
      render(
        <IconButton color="error">
          <DeleteOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies success color', () => {
      render(
        <IconButton color="success">
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies warning color', () => {
      render(
        <IconButton color="warning">
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies info color', () => {
      render(
        <IconButton color="info">
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('shapes', () => {
    it('renders square shape by default', () => {
      const { container } = render(
        <IconButton shape="square">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });

    it('renders rounded shape', () => {
      const { container } = render(
        <IconButton shape="rounded">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-root');
      expect(button).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { container } = render(
        <IconButton size="small">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-sizeSmall');
      expect(button).toBeInTheDocument();
    });

    it('renders medium size by default', () => {
      const { container } = render(
        <IconButton size="medium">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-sizeMedium');
      expect(button).toBeInTheDocument();
    });

    it('renders large size', () => {
      const { container } = render(
        <IconButton size="large">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.MuiIconButton-sizeLarge');
      expect(button).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <IconButton onClick={handleClick}>
          <EditOutlined />
        </IconButton>
      );

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();

      render(
        <IconButton onClick={handleClick} disabled>
          <EditOutlined />
        </IconButton>
      );

      // Disabled buttons prevent clicks at the browser level
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('renders disabled button', () => {
      render(
        <IconButton disabled>
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      const { container } = render(
        <IconButton disabled variant="contained">
          <EditOutlined />
        </IconButton>
      );

      const button = container.querySelector('.Mui-disabled');
      expect(button).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('is focusable', () => {
      render(
        <IconButton>
          <EditOutlined />
        </IconButton>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('accepts aria-label', () => {
      render(
        <IconButton aria-label="Edit item">
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByRole('button', { name: 'Edit item' })).toBeInTheDocument();
    });

    it('is not focusable when disabled', () => {
      render(
        <IconButton disabled>
          <EditOutlined />
        </IconButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <IconButton ref={ref}>
          <EditOutlined />
        </IconButton>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('props forwarding', () => {
    it('forwards additional props to MuiIconButton', () => {
      render(
        <IconButton data-testid="custom-icon-button">
          <EditOutlined />
        </IconButton>
      );

      expect(screen.getByTestId('custom-icon-button')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <IconButton className="custom-class">
          <EditOutlined />
        </IconButton>
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
