import type { Meta, StoryObj } from '@storybook/react';
import { FormLink } from './index';
import { Stack, Typography } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';

/**
 * FormLink is a styled link for form-related navigation.
 * Uses React Router Link with customizable typography and styling.
 */
const meta: Meta<typeof FormLink> = {
  title: 'Components/Form Fields/FormLink',
  component: FormLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'Link text',
    },
    to: {
      control: 'text',
      description: 'Navigation path',
    },
    variant: {
      control: 'select',
      options: ['h6', 'subtitle2', 'body2'],
      description: 'Typography variant',
    },
    underline: {
      control: 'boolean',
      description: 'Show underline on hover',
    },
    color: {
      control: 'text',
      description: 'Link color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormLink>;

/**
 * Default form link
 */
export const Default: Story = {
  args: {
    label: 'Forgot password?',
    to: '/forgot-password',
  },
};

/**
 * H6 variant (larger)
 */
export const H6Variant: Story = {
  args: {
    label: 'Create an account',
    to: '/register',
    variant: 'h6',
  },
};

/**
 * Subtitle2 variant
 */
export const Subtitle2Variant: Story = {
  args: {
    label: 'Already have an account? Sign in',
    to: '/login',
    variant: 'subtitle2',
  },
};

/**
 * Body2 variant (smaller)
 */
export const Body2Variant: Story = {
  args: {
    label: 'Terms of Service',
    to: '/terms',
    variant: 'body2',
  },
};

/**
 * With underline
 */
export const WithUnderline: Story = {
  args: {
    label: 'Privacy Policy',
    to: '/privacy',
    underline: true,
  },
};

/**
 * Without underline
 */
export const WithoutUnderline: Story = {
  args: {
    label: 'Learn more',
    to: '/about',
    underline: false,
  },
};

/**
 * Custom color
 */
export const CustomColor: Story = {
  args: {
    label: 'Contact Support',
    to: '/support',
    color: 'secondary.main',
  },
};

/**
 * Common form links
 */
export const CommonFormLinks: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Common Form Links</Typography>

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Login Page:</Typography>
          <FormLink label="Forgot password?" to="/forgot-password" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Login Page:</Typography>
          <FormLink label="Don't have an account? Sign up" to="/register" variant="subtitle2" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Registration Page:</Typography>
          <FormLink label="Already have an account? Sign in" to="/login" variant="subtitle2" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">Footer Links:</Typography>
          <Stack direction="row" spacing={2}>
            <FormLink label="Terms" to="/terms" variant="body2" />
            <FormLink label="Privacy" to="/privacy" variant="body2" />
            <FormLink label="Help" to="/help" variant="body2" />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Typography variant="h6">Link Variants</Typography>

      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">h6:</Typography>
          <FormLink label="Create an account" to="/register" variant="h6" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">subtitle2:</Typography>
          <FormLink label="Create an account" to="/register" variant="subtitle2" />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">body2:</Typography>
          <FormLink label="Create an account" to="/register" variant="body2" />
        </Stack>
      </Stack>
    </Stack>
  ),
};
