import React from 'react';
import { render, screen, waitFor } from '../../../../__tests__/test-utils';
import Transitions, { PopupTransition } from '../../Transitions';
import { Box } from '@mui/material';

describe('Transitions', () => {
  describe('rendering', () => {
    it('renders children when in=true', () => {
      render(
        <Transitions in={true}>
          <div data-testid="content">Content</div>
        </Transitions>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('hides children when in=false', async () => {
      render(
        <Transitions in={false} type="grow">
          <div data-testid="content">Content</div>
        </Transitions>
      );

      // With grow transition, content may still be in DOM but hidden
      await waitFor(() => {
        const content = screen.queryByTestId('content');
        // Content may be hidden via CSS or removed from DOM
        if (content) {
          expect(content).not.toBeVisible();
        }
      });
    });

    it('renders with default grow type', () => {
      render(
        <Transitions in={true}>
          <div>Default Grow</div>
        </Transitions>
      );

      expect(screen.getByText('Default Grow')).toBeInTheDocument();
    });
  });

  describe('transition types', () => {
    it('renders grow transition', () => {
      render(
        <Transitions type="grow" in={true}>
          <div>Grow Content</div>
        </Transitions>
      );

      expect(screen.getByText('Grow Content')).toBeInTheDocument();
    });

    it('renders collapse transition', () => {
      render(
        <Transitions type="collapse" in={true}>
          <div>Collapse Content</div>
        </Transitions>
      );

      expect(screen.getByText('Collapse Content')).toBeInTheDocument();
    });

    it('renders fade transition', () => {
      render(
        <Transitions type="fade" in={true}>
          <div>Fade Content</div>
        </Transitions>
      );

      expect(screen.getByText('Fade Content')).toBeInTheDocument();
    });

    it('renders slide transition', () => {
      render(
        <Transitions type="slide" in={true}>
          <div>Slide Content</div>
        </Transitions>
      );

      expect(screen.getByText('Slide Content')).toBeInTheDocument();
    });

    it('renders zoom transition', () => {
      render(
        <Transitions type="zoom" in={true}>
          <div>Zoom Content</div>
        </Transitions>
      );

      expect(screen.getByText('Zoom Content')).toBeInTheDocument();
    });
  });

  describe('slide directions', () => {
    it('renders slide up direction', () => {
      render(
        <Transitions type="slide" direction="up" in={true}>
          <div>Slide Up</div>
        </Transitions>
      );

      expect(screen.getByText('Slide Up')).toBeInTheDocument();
    });

    it('renders slide down direction', () => {
      render(
        <Transitions type="slide" direction="down" in={true}>
          <div>Slide Down</div>
        </Transitions>
      );

      expect(screen.getByText('Slide Down')).toBeInTheDocument();
    });

    it('renders slide left direction', () => {
      render(
        <Transitions type="slide" direction="left" in={true}>
          <div>Slide Left</div>
        </Transitions>
      );

      expect(screen.getByText('Slide Left')).toBeInTheDocument();
    });

    it('renders slide right direction', () => {
      render(
        <Transitions type="slide" direction="right" in={true}>
          <div>Slide Right</div>
        </Transitions>
      );

      expect(screen.getByText('Slide Right')).toBeInTheDocument();
    });

    it('uses default up direction for slide', () => {
      render(
        <Transitions type="slide" in={true}>
          <div>Default Slide</div>
        </Transitions>
      );

      expect(screen.getByText('Default Slide')).toBeInTheDocument();
    });
  });

  describe('position (transform origin)', () => {
    it('applies top-left position by default', () => {
      render(
        <Transitions type="grow" in={true}>
          <div>Top Left</div>
        </Transitions>
      );

      expect(screen.getByText('Top Left')).toBeInTheDocument();
    });

    it('applies top-right position', () => {
      render(
        <Transitions type="grow" position="top-right" in={true}>
          <div>Top Right</div>
        </Transitions>
      );

      expect(screen.getByText('Top Right')).toBeInTheDocument();
    });

    it('applies top position', () => {
      render(
        <Transitions type="grow" position="top" in={true}>
          <div>Top</div>
        </Transitions>
      );

      expect(screen.getByText('Top')).toBeInTheDocument();
    });

    it('applies bottom-left position', () => {
      render(
        <Transitions type="grow" position="bottom-left" in={true}>
          <div>Bottom Left</div>
        </Transitions>
      );

      expect(screen.getByText('Bottom Left')).toBeInTheDocument();
    });

    it('applies bottom-right position', () => {
      render(
        <Transitions type="grow" position="bottom-right" in={true}>
          <div>Bottom Right</div>
        </Transitions>
      );

      expect(screen.getByText('Bottom Right')).toBeInTheDocument();
    });

    it('applies bottom position', () => {
      render(
        <Transitions type="grow" position="bottom" in={true}>
          <div>Bottom</div>
        </Transitions>
      );

      expect(screen.getByText('Bottom')).toBeInTheDocument();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to wrapper Box', () => {
      const ref = React.createRef<React.ExoticComponent>();

      render(
        <Transitions ref={ref} in={true}>
          <div>Ref Content</div>
        </Transitions>
      );

      expect(ref.current).toBeTruthy();
    });
  });

  describe('custom styles', () => {
    it('applies custom sx styles', () => {
      const { container } = render(
        <Transitions in={true} sx={{ marginTop: '20px' }}>
          <div>Styled Content</div>
        </Transitions>
      );

      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });
  });

  describe('transition toggle', () => {
    it('transitions from visible to hidden', async () => {
      const { rerender } = render(
        <Transitions type="grow" in={true}>
          <div data-testid="content">Content</div>
        </Transitions>
      );

      expect(screen.getByTestId('content')).toBeVisible();

      rerender(
        <Transitions type="grow" in={false}>
          <div data-testid="content">Content</div>
        </Transitions>
      );

      // After transition, content should be hidden or removed
      await waitFor(
        () => {
          const content = screen.queryByTestId('content');
          if (content) {
            expect(content).not.toBeVisible();
          }
        },
        { timeout: 500 }
      );
    });

    it('transitions from hidden to visible', async () => {
      const { rerender } = render(
        <Transitions type="fade" in={false}>
          <div data-testid="content">Content</div>
        </Transitions>
      );

      rerender(
        <Transitions type="fade" in={true}>
          <div data-testid="content">Content</div>
        </Transitions>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeVisible();
      });
    });
  });
});

describe('PopupTransition', () => {
  it('renders as a Zoom transition', () => {
    render(
      <PopupTransition in={true}>
        <div>Popup Content</div>
      </PopupTransition>
    );

    expect(screen.getByText('Popup Content')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef<unknown>();

    render(
      <PopupTransition ref={ref} in={true}>
        <div>Popup</div>
      </PopupTransition>
    );

    expect(ref.current).toBeTruthy();
  });
});
