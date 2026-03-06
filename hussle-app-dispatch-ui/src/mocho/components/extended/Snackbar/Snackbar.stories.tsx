import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Snackbar from '../Snackbar';
import { Button, Stack, Typography } from '@mui/material';

/**
 * Snackbar displays brief notifications with customizable animations,
 * positions, and alert variants.
 */
const meta: Meta<typeof Snackbar> = {
  title: 'Components/Extended/Snackbar',
  component: Snackbar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'alert'],
      description: 'Snackbar variant type',
    },
    transition: {
      control: 'select',
      options: ['SlideLeft', 'SlideUp', 'SlideRight', 'SlideDown', 'Grow', 'Fade'],
      description: 'Animation transition type',
    },
    autoHideDuration: {
      control: 'number',
      description: 'Auto hide duration in milliseconds',
    },
    actionButton: {
      control: 'boolean',
      description: 'Show action button',
    },
    close: {
      control: 'boolean',
      description: 'Show close button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Snackbar>;

// Interactive wrapper for Snackbar stories
const SnackbarDemo = ({
  message = 'This is a notification',
  variant = 'default' as const,
  transition = 'SlideUp' as const,
  alert = { variant: 'filled' as const, color: 'success' as const },
  ...props
}: Partial<React.ComponentProps<typeof Snackbar>>) => {
  const [open, setOpen] = useState(false);

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Show Snackbar
      </Button>
      <Snackbar
        open={open}
        message={message}
        variant={variant}
        transition={transition}
        alert={alert}
        onClose={() => setOpen(false)}
        {...props}
      />
    </Stack>
  );
};

/**
 * Default snackbar notification
 */
export const Default: Story = {
  render: () => <SnackbarDemo message="This is a default notification" />,
};

/**
 * Success alert snackbar
 */
export const SuccessAlert: Story = {
  render: () => (
    <SnackbarDemo
      message="Operation completed successfully!"
      variant="alert"
      alert={{ variant: 'filled', color: 'success' }}
    />
  ),
};

/**
 * Error alert snackbar
 */
export const ErrorAlert: Story = {
  render: () => (
    <SnackbarDemo
      message="An error occurred. Please try again."
      variant="alert"
      alert={{ variant: 'filled', color: 'error' }}
    />
  ),
};

/**
 * Warning alert snackbar
 */
export const WarningAlert: Story = {
  render: () => (
    <SnackbarDemo
      message="Warning: This action cannot be undone."
      variant="alert"
      alert={{ variant: 'filled', color: 'warning' }}
    />
  ),
};

/**
 * Info alert snackbar
 */
export const InfoAlert: Story = {
  render: () => (
    <SnackbarDemo
      message="New updates are available."
      variant="alert"
      alert={{ variant: 'filled', color: 'info' }}
    />
  ),
};

/**
 * Outlined alert variant
 */
export const OutlinedAlert: Story = {
  render: () => (
    <SnackbarDemo
      message="This is an outlined alert"
      variant="alert"
      alert={{ variant: 'outlined', color: 'success' }}
    />
  ),
};

/**
 * Standard alert variant
 */
export const StandardAlert: Story = {
  render: () => (
    <SnackbarDemo
      message="This is a standard alert"
      variant="alert"
      alert={{ variant: 'standard', color: 'info' }}
    />
  ),
};

/**
 * Slide Left transition
 */
export const SlideLeftTransition: Story = {
  render: () => (
    <SnackbarDemo
      message="Sliding in from the right"
      transition="SlideLeft"
    />
  ),
};

/**
 * Slide Up transition (default)
 */
export const SlideUpTransition: Story = {
  render: () => (
    <SnackbarDemo
      message="Sliding up from bottom"
      transition="SlideUp"
    />
  ),
};

/**
 * Grow transition
 */
export const GrowTransition: Story = {
  render: () => (
    <SnackbarDemo
      message="Growing into view"
      transition="Grow"
    />
  ),
};

/**
 * Fade transition
 */
export const FadeTransition: Story = {
  render: () => (
    <SnackbarDemo
      message="Fading into view"
      transition="Fade"
    />
  ),
};

/**
 * Without action button
 */
export const NoActionButton: Story = {
  render: () => (
    <SnackbarDemo
      message="No undo button"
      variant="alert"
      alert={{ variant: 'filled', color: 'info' }}
      actionButton={false}
    />
  ),
};

/**
 * Without close button
 */
export const NoCloseButton: Story = {
  render: () => (
    <SnackbarDemo
      message="No close button - auto dismisses"
      variant="alert"
      alert={{ variant: 'filled', color: 'success' }}
      close={false}
    />
  ),
};

/**
 * All alert colors showcase
 */
export const AllAlertColors: Story = {
  render: () => {
    const [openState, setOpenState] = useState({
      success: false,
      error: false,
      warning: false,
      info: false,
    });

    return (
      <Stack spacing={4}>
        <Typography variant="h6">Alert Snackbar Colors</Typography>

        <Stack spacing={2} direction="row" flexWrap="wrap">
          <Button
            variant="contained"
            color="success"
            onClick={() => setOpenState(s => ({ ...s, success: true }))}
          >
            Success
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenState(s => ({ ...s, error: true }))}
          >
            Error
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => setOpenState(s => ({ ...s, warning: true }))}
          >
            Warning
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={() => setOpenState(s => ({ ...s, info: true }))}
          >
            Info
          </Button>
        </Stack>

        <Snackbar
          open={openState.success}
          message="Success! Operation completed."
          variant="alert"
          alert={{ variant: 'filled', color: 'success' }}
          onClose={() => setOpenState(s => ({ ...s, success: false }))}
        />
        <Snackbar
          open={openState.error}
          message="Error! Something went wrong."
          variant="alert"
          alert={{ variant: 'filled', color: 'error' }}
          onClose={() => setOpenState(s => ({ ...s, error: false }))}
        />
        <Snackbar
          open={openState.warning}
          message="Warning! Please review your input."
          variant="alert"
          alert={{ variant: 'filled', color: 'warning' }}
          onClose={() => setOpenState(s => ({ ...s, warning: false }))}
        />
        <Snackbar
          open={openState.info}
          message="Info: New features available."
          variant="alert"
          alert={{ variant: 'filled', color: 'info' }}
          onClose={() => setOpenState(s => ({ ...s, info: false }))}
        />
      </Stack>
    );
  },
};

/**
 * All transitions showcase
 */
export const AllTransitions: Story = {
  render: () => {
    const [openState, setOpenState] = useState({
      slideLeft: false,
      slideUp: false,
      slideRight: false,
      slideDown: false,
      grow: false,
      fade: false,
    });

    return (
      <Stack spacing={4}>
        <Typography variant="h6">Transition Animations</Typography>

        <Stack spacing={2} direction="row" flexWrap="wrap">
          <Button
            variant="outlined"
            onClick={() => setOpenState(s => ({ ...s, slideLeft: true }))}
          >
            Slide Left
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenState(s => ({ ...s, slideUp: true }))}
          >
            Slide Up
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenState(s => ({ ...s, slideRight: true }))}
          >
            Slide Right
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenState(s => ({ ...s, slideDown: true }))}
          >
            Slide Down
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenState(s => ({ ...s, grow: true }))}
          >
            Grow
          </Button>
          <Button
            variant="outlined"
            onClick={() => setOpenState(s => ({ ...s, fade: true }))}
          >
            Fade
          </Button>
        </Stack>

        <Snackbar
          open={openState.slideLeft}
          message="Slide Left transition"
          transition="SlideLeft"
          onClose={() => setOpenState(s => ({ ...s, slideLeft: false }))}
        />
        <Snackbar
          open={openState.slideUp}
          message="Slide Up transition"
          transition="SlideUp"
          onClose={() => setOpenState(s => ({ ...s, slideUp: false }))}
        />
        <Snackbar
          open={openState.slideRight}
          message="Slide Right transition"
          transition="SlideRight"
          onClose={() => setOpenState(s => ({ ...s, slideRight: false }))}
        />
        <Snackbar
          open={openState.slideDown}
          message="Slide Down transition"
          transition="SlideDown"
          onClose={() => setOpenState(s => ({ ...s, slideDown: false }))}
        />
        <Snackbar
          open={openState.grow}
          message="Grow transition"
          transition="Grow"
          onClose={() => setOpenState(s => ({ ...s, grow: false }))}
        />
        <Snackbar
          open={openState.fade}
          message="Fade transition"
          transition="Fade"
          onClose={() => setOpenState(s => ({ ...s, fade: false }))}
        />
      </Stack>
    );
  },
};
