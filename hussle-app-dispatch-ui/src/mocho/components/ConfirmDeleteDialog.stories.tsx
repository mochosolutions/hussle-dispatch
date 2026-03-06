import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

/**
 * ConfirmDeleteDialog - A specialized confirmation dialog for delete operations.
 *
 * Use this component when you need to confirm destructive delete actions.
 * It comes pre-configured with appropriate warning styling and default messages.
 */
const meta: Meta<typeof ConfirmDeleteDialog> = {
  title: 'Components/Feedback/ConfirmDeleteDialog',
  component: ConfirmDeleteDialog,
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
      description: 'Dialog title (default: "Delete Item")',
    },
    message: {
      control: 'text',
      description: 'Warning message displayed to user',
    },
    confirmLabel: {
      control: 'text',
      description: 'Label for confirm button (default: "Delete")',
    },
    cancelLabel: {
      control: 'text',
      description: 'Label for cancel button (default: "Cancel")',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Callback when user confirms deletion',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback when user cancels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDeleteDialog>;

/**
 * Default delete confirmation dialog
 */
export const Default: Story = {
  args: {
    open: true,
    onConfirm: action('confirmed'),
    onCancel: action('cancelled'),
  },
};

/**
 * Delete dialog with custom title
 */
export const CustomTitle: Story = {
  args: {
    open: true,
    title: 'Delete Blog Post',
    message: 'Are you sure you want to delete this blog post? This action cannot be undone.',
    onConfirm: action('confirmed'),
    onCancel: action('cancelled'),
  },
};

/**
 * Delete dialog for user deletion
 */
export const DeleteUser: Story = {
  args: {
    open: true,
    title: 'Delete User Account',
    message: 'This will permanently delete the user account and all associated data. This action cannot be undone.',
    confirmLabel: 'Delete Account',
    cancelLabel: 'Keep Account',
    onConfirm: action('confirmed'),
    onCancel: action('cancelled'),
  },
};

/**
 * Delete dialog for file deletion
 */
export const DeleteFile: Story = {
  args: {
    open: true,
    title: 'Delete File',
    message: 'The file "document.pdf" will be permanently deleted. This action cannot be undone.',
    onConfirm: action('confirmed'),
    onCancel: action('cancelled'),
  },
};

/**
 * Delete dialog with custom button labels
 */
export const CustomLabels: Story = {
  args: {
    open: true,
    title: 'Remove Item',
    message: 'Are you sure you want to remove this item from your cart?',
    confirmLabel: 'Yes, Remove',
    cancelLabel: 'No, Keep It',
    onConfirm: action('confirmed'),
    onCancel: action('cancelled'),
  },
};

/**
 * Interactive example with trigger button
 */
export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [itemName, setItemName] = useState('');

    const handleDelete = (name: string) => {
      setItemName(name);
      setOpen(true);
    };

    const handleConfirm = () => {
      action('deleted')(itemName);
      setOpen(false);
    };

    const handleCancel = () => {
      action('cancelled')();
      setOpen(false);
    };

    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Click an item to trigger the delete dialog:
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDelete('Blog Post')}
          >
            Delete Blog Post
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDelete('User Account')}
          >
            Delete User Account
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDelete('Category')}
          >
            Delete Category
          </Button>
        </Stack>

        <ConfirmDeleteDialog
          open={open}
          title={`Delete ${itemName}`}
          message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </Stack>
    );
  },
};

/**
 * Bulk delete confirmation
 */
export const BulkDelete: Story = {
  args: {
    open: true,
    title: 'Delete Selected Items',
    message: 'You are about to delete 5 selected items. This action cannot be undone.',
    confirmLabel: 'Delete All',
    onConfirm: action('bulk-delete-confirmed'),
    onCancel: action('cancelled'),
  },
};
