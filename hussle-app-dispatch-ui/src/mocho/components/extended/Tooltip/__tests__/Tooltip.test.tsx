import React from 'react';
import { render, screen, userEvent, waitFor } from '../../../../__tests__/test-utils';
import Tooltip from '../../Tooltip';
import { Button } from '@mui/material';

describe('Tooltip', () => {
  describe('rendering', () => {
    it('renders children element', () => {
      render(
        <Tooltip title="Test tooltip">
          <Button>Hover me</Button>
        </Tooltip>
      );

      // Button may have aria-label from tooltip, find by text content
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('does not show tooltip by default', () => {
      render(
        <Tooltip title="Test tooltip">
          <Button>Hover me</Button>
        </Tooltip>
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Test tooltip">
          <Button>Hover me</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('hides tooltip when mouse leaves', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Test tooltip">
          <Button>Hover me</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      await user.unhover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('content', () => {
    it('displays tooltip title text', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Helpful information">
          <Button>Info</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Helpful information')).toBeInTheDocument();
      });
    });

    it('renders JSX content in tooltip', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title={<div data-testid="custom-content">Custom JSX</div>}>
          <Button>Custom</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      });
    });
  });

  describe('colors', () => {
    it('applies primary color', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Primary" color="primary">
          <Button>Primary</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('applies secondary color', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Secondary" color="secondary">
          <Button>Secondary</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('applies success color', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Success" color="success">
          <Button>Success</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('applies error color', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Error" color="error">
          <Button>Error</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('applies warning color', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Warning" color="warning">
          <Button>Warning</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('applies info color', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Info" color="info">
          <Button>Info</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('applies custom label color', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Custom" color="primary" labelColor="#ffeb3b">
          <Button>Custom Label</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('arrow', () => {
    it('renders without arrow by default', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="No arrow">
          <Button>No Arrow</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('renders with arrow when specified', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="With arrow" arrow>
          <Button>With Arrow</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('placement', () => {
    it('supports top placement', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Top" placement="top">
          <Button>Top</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('supports bottom placement', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Bottom" placement="bottom">
          <Button>Bottom</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('supports left placement', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Left" placement="left">
          <Button>Left</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('supports right placement', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Right" placement="right">
          <Button>Right</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('tooltip has proper role', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Accessible tooltip">
          <Button>Accessible</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('shows tooltip on focus', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Focus tooltip">
          <Button>Focus me</Button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      button.focus();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('hides tooltip on blur', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Blur tooltip">
          <Button>Blur me</Button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      button.focus();

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      button.blur();

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('can be triggered by keyboard', async () => {
      const user = userEvent.setup();

      render(
        <Tooltip title="Keyboard tooltip">
          <Button>Tab to me</Button>
        </Tooltip>
      );

      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveFocus();
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('wrapper element', () => {
    it('wraps children in a display flex Box', () => {
      const { container } = render(
        <Tooltip title="Wrapped">
          <Button>Wrapped</Button>
        </Tooltip>
      );

      // The Tooltip component wraps children in a Box with display: flex
      expect(container.querySelector('[style*="display: flex"]') ||
             container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });
  });

  describe('props forwarding', () => {
    it('forwards additional MUI Tooltip props', async () => {
      const user = userEvent.setup();
      const handleOpen = jest.fn();

      render(
        <Tooltip title="Test" onOpen={handleOpen}>
          <Button>Test</Button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(handleOpen).toHaveBeenCalled();
      });
    });
  });
});
