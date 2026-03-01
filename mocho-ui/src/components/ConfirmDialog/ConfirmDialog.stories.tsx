import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { Button, Stack } from '@mui/material';
import ConfirmDialog from './index';

/**
 * ConfirmDialog - A reusable confirmation dialog component with severity-based styling.
 *
 * Use this component when you need to confirm user actions with different severity levels
 * (warning, error, info). The dialog includes an icon, title, message, and action buttons.
 */
const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Feedback/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    title: {
      control: 'text',
      description: 'Dialog title displayed with an icon',
    },
    message: {
      control: 'text',
      description: 'Dialog message/description',
    },
    content: {
      control: 'text',
      description: 'Alternative to message - can be string or React node',
    },
    severity: {
      control: 'select',
      options: ['warning', 'error', 'info'],
      description: 'Severity level that determines icon and button color',
    },
    confirmLabel: {
      control: 'text',
      description: 'Label for confirm button (default: "Confirm")',
    },
    cancelLabel: {
      control: 'text',
      description: 'Label for cancel button (default: "Cancel")',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Callback when user confirms',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when dialog closes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

/**
 * Default warning confirmation dialog
 */
export const Default: Story = {
  args: {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action?',
    severity: 'warning',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: action('confirmed'),
    onClose: action('closed'),
  },
};

/**
 * Error severity dialog for destructive actions
 */
export const ErrorSeverity: Story = {
  args: {
    open: true,
    title: 'Delete Item',
    message: 'This action cannot be undone. Are you sure you want to delete this item?',
    severity: 'error',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm: action('confirmed'),
    onClose: action('closed'),
  },
};

/**
 * Info severity dialog for informational confirmations
 */
export const InfoSeverity: Story = {
  args: {
    open: true,
    title: 'Save Changes',
    message: 'Do you want to save your changes before leaving?',
    severity: 'info',
    confirmLabel: 'Save',
    cancelLabel: 'Discard',
    onConfirm: action('confirmed'),
    onClose: action('closed'),
  },
};

/**
 * Warning severity dialog (default)
 */
export const WarningSeverity: Story = {
  args: {
    open: true,
    title: 'Publish Post',
    message: 'Once published, this post will be visible to all users. Continue?',
    severity: 'warning',
    confirmLabel: 'Publish',
    cancelLabel: 'Cancel',
    onConfirm: action('confirmed'),
    onClose: action('closed'),
  },
};

/**
 * Dialog with custom button labels
 */
export const CustomLabels: Story = {
  args: {
    open: true,
    title: 'Logout',
    message: 'You will be logged out of your account. Any unsaved changes will be lost.',
    severity: 'warning',
    confirmLabel: 'Yes, Logout',
    cancelLabel: 'Stay Logged In',
    onConfirm: action('confirmed'),
    onClose: action('closed'),
  },
};

/**
 * Interactive example with trigger button
 */
export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [severity, setSeverity] = useState<'warning' | 'error' | 'info'>('warning');

    const handleConfirm = () => {
      action('confirmed')();
      setOpen(false);
    };

    const handleClose = () => {
      action('closed')();
      setOpen(false);
    };

    return (
      <Stack spacing={2} direction="row">
        <Button
          variant="contained"
          color="warning"
          onClick={() => {
            setSeverity('warning');
            setOpen(true);
          }}
        >
          Warning Dialog
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            setSeverity('error');
            setOpen(true);
          }}
        >
          Error Dialog
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={() => {
            setSeverity('info');
            setOpen(true);
          }}
        >
          Info Dialog
        </Button>

        <ConfirmDialog
          open={open}
          title={`${severity.charAt(0).toUpperCase() + severity.slice(1)} Confirmation`}
          message={`This is a ${severity} severity confirmation dialog. Click confirm to proceed.`}
          severity={severity}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      </Stack>
    );
  },
};

/**
 * All severity levels comparison
 */
export const AllSeverities: Story = {
  render: () => (
    <Stack spacing={2}>
      <ConfirmDialog
        open={true}
        title="Warning Message"
        message="This is a warning confirmation"
        severity="warning"
        onConfirm={action('warning-confirmed')}
        onClose={action('warning-closed')}
      />
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all three severity levels side by side for comparison.',
      },
    },
  },
};
