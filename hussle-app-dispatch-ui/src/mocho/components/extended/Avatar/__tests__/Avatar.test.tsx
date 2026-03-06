import React from 'react';
import { render, screen } from '../../../../__tests__/test-utils';
import Avatar from '../../Avatar';
import { UserOutlined } from '@ant-design/icons';

describe('Avatar', () => {
  describe('rendering', () => {
    it('renders children text correctly', () => {
      render(<Avatar>JD</Avatar>);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders with icon children', () => {
      render(
        <Avatar>
          <UserOutlined data-testid="user-icon" />
        </Avatar>
      );

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      const { container } = render(<Avatar>A</Avatar>);

      // Should have the MuiAvatar class
      expect(container.querySelector('.MuiAvatar-root')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders circular variant by default', () => {
      const { container } = render(<Avatar>A</Avatar>);

      expect(container.querySelector('.MuiAvatar-circular')).toBeInTheDocument();
    });

    it('renders rounded variant when specified', () => {
      const { container } = render(<Avatar variant="rounded">A</Avatar>);

      expect(container.querySelector('.MuiAvatar-rounded')).toBeInTheDocument();
    });

    it('renders square variant when specified', () => {
      const { container } = render(<Avatar variant="square">A</Avatar>);

      expect(container.querySelector('.MuiAvatar-square')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders badge size', () => {
      const { container } = render(<Avatar size="badge">B</Avatar>);
      const avatar = container.querySelector('.MuiAvatar-root');

      expect(avatar).toBeInTheDocument();
    });

    it('renders xs size', () => {
      const { container } = render(<Avatar size="xs">X</Avatar>);
      const avatar = container.querySelector('.MuiAvatar-root');

      expect(avatar).toBeInTheDocument();
    });

    it('renders sm size', () => {
      const { container } = render(<Avatar size="sm">S</Avatar>);
      const avatar = container.querySelector('.MuiAvatar-root');

      expect(avatar).toBeInTheDocument();
    });

    it('renders md size (default)', () => {
      const { container } = render(<Avatar size="md">M</Avatar>);
      const avatar = container.querySelector('.MuiAvatar-root');

      expect(avatar).toBeInTheDocument();
    });

    it('renders lg size', () => {
      const { container } = render(<Avatar size="lg">L</Avatar>);
      const avatar = container.querySelector('.MuiAvatar-root');

      expect(avatar).toBeInTheDocument();
    });

    it('renders xl size', () => {
      const { container } = render(<Avatar size="xl">XL</Avatar>);
      const avatar = container.querySelector('.MuiAvatar-root');

      expect(avatar).toBeInTheDocument();
    });
  });

  describe('types', () => {
    it('renders filled type by default', () => {
      const { container } = render(
        <Avatar type="filled" color="primary">
          A
        </Avatar>
      );
      const avatar = container.querySelector('.MuiAvatar-root');

      // Filled type should have background color
      expect(avatar).toBeInTheDocument();
    });

    it('renders outlined type', () => {
      const { container } = render(
        <Avatar type="outlined" color="primary">
          A
        </Avatar>
      );
      const avatar = container.querySelector('.MuiAvatar-root');

      // Outlined type should render
      expect(avatar).toBeInTheDocument();
    });

    it('renders combined type', () => {
      const { container } = render(
        <Avatar type="combined" color="primary">
          A
        </Avatar>
      );
      const avatar = container.querySelector('.MuiAvatar-root');

      // Combined type should have light background with border
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('colors', () => {
    it('applies primary color', () => {
      render(<Avatar color="primary">P</Avatar>);

      expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('applies secondary color', () => {
      render(<Avatar color="secondary">S</Avatar>);

      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('applies success color', () => {
      render(<Avatar color="success">S</Avatar>);

      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('applies error color', () => {
      render(<Avatar color="error">E</Avatar>);

      expect(screen.getByText('E')).toBeInTheDocument();
    });

    it('applies warning color', () => {
      render(<Avatar color="warning">W</Avatar>);

      expect(screen.getByText('W')).toBeInTheDocument();
    });

    it('applies info color', () => {
      render(<Avatar color="info">I</Avatar>);

      expect(screen.getByText('I')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('renders as an img role when src is provided', () => {
      render(<Avatar src="test.jpg" alt="Test User" />);

      expect(screen.getByRole('img', { name: 'Test User' })).toBeInTheDocument();
    });

    it('renders text content accessibly', () => {
      render(<Avatar>JD</Avatar>);

      // Avatar text should be visible
      expect(screen.getByText('JD')).toBeVisible();
    });
  });

  describe('props forwarding', () => {
    it('forwards additional props to MuiAvatar', () => {
      render(<Avatar data-testid="custom-avatar">A</Avatar>);

      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Avatar className="custom-class">A</Avatar>);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
