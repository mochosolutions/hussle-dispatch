import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Transitions from '../Transitions';
import { Button, Stack, Typography, Paper, Box } from '@mui/material';

/**
 * Transitions provides various animation effects for elements entering/exiting the DOM.
 * Supports grow, collapse, fade, slide, and zoom animations with customizable positions.
 */
const meta: Meta<typeof Transitions> = {
  title: 'Components/Extended/Transitions',
  component: Transitions,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['grow', 'collapse', 'fade', 'slide', 'zoom'],
      description: 'Transition animation type',
    },
    position: {
      control: 'select',
      options: ['top-left', 'top-right', 'top', 'bottom-left', 'bottom-right', 'bottom'],
      description: 'Transform origin position',
    },
    direction: {
      control: 'select',
      options: ['up', 'down', 'left', 'right'],
      description: 'Slide direction (only for slide type)',
    },
    in: {
      control: 'boolean',
      description: 'Show/hide the content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Transitions>;

// Demo content for transitions
const DemoContent = () => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      width: 250,
      textAlign: 'center',
      bgcolor: 'primary.light',
      color: 'primary.contrastText',
    }}
  >
    <Typography variant="h6">Transition Content</Typography>
    <Typography variant="body2">This content animates in and out</Typography>
  </Paper>
);

// Interactive wrapper for transition demos
const TransitionDemo = ({
  type = 'grow',
  position = 'top-left',
  direction = 'up',
}: {
  type?: string;
  position?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}) => {
  const [show, setShow] = useState(true);

  return (
    <Stack spacing={3}>
      <Button variant="contained" onClick={() => setShow(!show)}>
        {show ? 'Hide' : 'Show'} Content
      </Button>
      <Box sx={{ minHeight: 150 }}>
        <Transitions type={type} position={position} direction={direction} in={show}>
          <DemoContent />
        </Transitions>
      </Box>
    </Stack>
  );
};

/**
 * Grow transition (default)
 */
export const Grow: Story = {
  render: () => <TransitionDemo type="grow" />,
};

/**
 * Collapse transition
 */
export const Collapse: Story = {
  render: () => <TransitionDemo type="collapse" />,
};

/**
 * Fade transition
 */
export const Fade: Story = {
  render: () => <TransitionDemo type="fade" />,
};

/**
 * Slide up transition
 */
export const SlideUp: Story = {
  render: () => <TransitionDemo type="slide" direction="up" />,
};

/**
 * Slide down transition
 */
export const SlideDown: Story = {
  render: () => <TransitionDemo type="slide" direction="down" />,
};

/**
 * Slide left transition
 */
export const SlideLeft: Story = {
  render: () => <TransitionDemo type="slide" direction="left" />,
};

/**
 * Slide right transition
 */
export const SlideRight: Story = {
  render: () => <TransitionDemo type="slide" direction="right" />,
};

/**
 * Zoom transition
 */
export const Zoom: Story = {
  render: () => <TransitionDemo type="zoom" />,
};

/**
 * Transform origin: top-left (default)
 */
export const PositionTopLeft: Story = {
  render: () => <TransitionDemo type="grow" position="top-left" />,
};

/**
 * Transform origin: top-right
 */
export const PositionTopRight: Story = {
  render: () => <TransitionDemo type="grow" position="top-right" />,
};

/**
 * Transform origin: top
 */
export const PositionTop: Story = {
  render: () => <TransitionDemo type="grow" position="top" />,
};

/**
 * Transform origin: bottom
 */
export const PositionBottom: Story = {
  render: () => <TransitionDemo type="grow" position="bottom" />,
};

/**
 * All transition types showcase
 */
export const AllTransitionTypes: Story = {
  render: () => {
    const [showState, setShowState] = useState({
      grow: true,
      collapse: true,
      fade: true,
      slide: true,
      zoom: true,
    });

    const toggleAll = () => {
      const allShown = Object.values(showState).every(Boolean);
      setShowState({
        grow: !allShown,
        collapse: !allShown,
        fade: !allShown,
        slide: !allShown,
        zoom: !allShown,
      });
    };

    return (
      <Stack spacing={4}>
        <Typography variant="h6">All Transition Types</Typography>

        <Button variant="contained" onClick={toggleAll}>
          Toggle All
        </Button>

        <Stack spacing={4}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ width: 80 }}>Grow:</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowState(s => ({ ...s, grow: !s.grow }))}
              >
                Toggle
              </Button>
            </Stack>
            <Box sx={{ minHeight: 100 }}>
              <Transitions type="grow" in={showState.grow}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', width: 150 }}>
                  Grow
                </Paper>
              </Transitions>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ width: 80 }}>Collapse:</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowState(s => ({ ...s, collapse: !s.collapse }))}
              >
                Toggle
              </Button>
            </Stack>
            <Box sx={{ minHeight: 100 }}>
              <Transitions type="collapse" in={showState.collapse}>
                <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'white', width: 150 }}>
                  Collapse
                </Paper>
              </Transitions>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ width: 80 }}>Fade:</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowState(s => ({ ...s, fade: !s.fade }))}
              >
                Toggle
              </Button>
            </Stack>
            <Box sx={{ minHeight: 100 }}>
              <Transitions type="fade" in={showState.fade}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white', width: 150 }}>
                  Fade
                </Paper>
              </Transitions>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ width: 80 }}>Slide:</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowState(s => ({ ...s, slide: !s.slide }))}
              >
                Toggle
              </Button>
            </Stack>
            <Box sx={{ minHeight: 100 }}>
              <Transitions type="slide" direction="up" in={showState.slide}>
                <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'white', width: 150 }}>
                  Slide Up
                </Paper>
              </Transitions>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ width: 80 }}>Zoom:</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowState(s => ({ ...s, zoom: !s.zoom }))}
              >
                Toggle
              </Button>
            </Stack>
            <Box sx={{ minHeight: 100 }}>
              <Transitions type="zoom" in={showState.zoom}>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'white', width: 150 }}>
                  Zoom
                </Paper>
              </Transitions>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    );
  },
};

/**
 * Slide directions showcase
 */
export const AllSlideDirections: Story = {
  render: () => {
    const [showState, setShowState] = useState({
      up: true,
      down: true,
      left: true,
      right: true,
    });

    return (
      <Stack spacing={4}>
        <Typography variant="h6">Slide Directions</Typography>

        <Stack spacing={4}>
          <Stack spacing={2} direction="row">
            <Button
              variant="outlined"
              onClick={() => setShowState(s => ({ ...s, up: !s.up }))}
            >
              Toggle Up
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowState(s => ({ ...s, down: !s.down }))}
            >
              Toggle Down
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowState(s => ({ ...s, left: !s.left }))}
            >
              Toggle Left
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowState(s => ({ ...s, right: !s.right }))}
            >
              Toggle Right
            </Button>
          </Stack>

          <Stack direction="row" spacing={4} flexWrap="wrap">
            <Box sx={{ minHeight: 120, minWidth: 150 }}>
              <Transitions type="slide" direction="up" in={showState.up}>
                <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  Slide Up
                </Paper>
              </Transitions>
            </Box>
            <Box sx={{ minHeight: 120, minWidth: 150 }}>
              <Transitions type="slide" direction="down" in={showState.down}>
                <Paper sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
                  Slide Down
                </Paper>
              </Transitions>
            </Box>
            <Box sx={{ minHeight: 120, minWidth: 150 }}>
              <Transitions type="slide" direction="left" in={showState.left}>
                <Paper sx={{ p: 2, bgcolor: 'success.main', color: 'white' }}>
                  Slide Left
                </Paper>
              </Transitions>
            </Box>
            <Box sx={{ minHeight: 120, minWidth: 150 }}>
              <Transitions type="slide" direction="right" in={showState.right}>
                <Paper sx={{ p: 2, bgcolor: 'error.main', color: 'white' }}>
                  Slide Right
                </Paper>
              </Transitions>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    );
  },
};

/**
 * Common use case: Dropdown menu
 */
export const DropdownMenuExample: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Stack spacing={2}>
        <Typography variant="h6">Dropdown Menu Example</Typography>

        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Button variant="contained" onClick={() => setOpen(!open)}>
            {open ? 'Close Menu' : 'Open Menu'}
          </Button>
          <Box sx={{ position: 'absolute', top: '100%', left: 0, mt: 1, zIndex: 1 }}>
            <Transitions type="grow" position="top-left" in={open}>
              <Paper elevation={8} sx={{ minWidth: 200 }}>
                <Stack>
                  <Button sx={{ justifyContent: 'flex-start', px: 2 }}>Profile</Button>
                  <Button sx={{ justifyContent: 'flex-start', px: 2 }}>Settings</Button>
                  <Button sx={{ justifyContent: 'flex-start', px: 2 }}>Help</Button>
                  <Button sx={{ justifyContent: 'flex-start', px: 2 }} color="error">
                    Logout
                  </Button>
                </Stack>
              </Paper>
            </Transitions>
          </Box>
        </Box>
      </Stack>
    );
  },
};
